"""Kafka consumer/producer: scores pending transactions asynchronously."""

import json
import logging
import os
import threading
import time

import pandas as pd
from confluent_kafka import Consumer, KafkaError, Producer
from xgboost import DMatrix

from explainability import compute_shap_values
from features import compute_features
from routes.predict import model, FEATURE_ORDER, FEATURE_TYPES
from rules import apply_rules
from schemas import PredictRequest, parse_ts

logger = logging.getLogger(__name__)

TOPIC_PENDING = "fraud.transactions.pending"
TOPIC_SCORED = "fraud.transactions.scored"
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")


def _run_prediction(payload: dict) -> dict:
    """Score one transaction and return the Kafka result message."""
    req = PredictRequest(transaction=payload["transaction"], history=payload.get("history", []))
    txn = req.transaction
    curr_time = parse_ts(txn.timestamp).timestamp() if txn.timestamp else time.time()

    features = compute_features(txn, curr_time, req.history)
    input_df = pd.DataFrame([features])[FEATURE_ORDER]
    dmatrix = DMatrix(input_df, enable_categorical=True, feature_names=FEATURE_ORDER, feature_types=FEATURE_TYPES)
    ml_score = float(model.get_booster().predict(dmatrix)[0])

    fraud_prob, triggered_rules = apply_rules(features, ml_score)

    return {
        "transactionId": payload["transactionId"],
        "result": {
            "fraud_probability": fraud_prob,
            "is_fraud": fraud_prob > 0.5,
            "features": features,
            "triggered_rules": triggered_rules,
            "shap": compute_shap_values(model, input_df, FEATURE_ORDER),
        },
    }


def _consumer_loop() -> None:
    consumer = Consumer({"bootstrap.servers": BOOTSTRAP_SERVERS, "group.id": "fraud-engine", "auto.offset.reset": "earliest"})
    producer = Producer({"bootstrap.servers": BOOTSTRAP_SERVERS})
    consumer.subscribe([TOPIC_PENDING])
    logger.info("Kafka consumer subscribed to %s", TOPIC_PENDING)

    while True:
        try:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            err = msg.error()
            if err is not None:
                if err.code() == KafkaError._PARTITION_EOF:
                    continue
                logger.error("Kafka error: %s", err)
                continue

            raw = msg.value()
            if raw is None:
                continue
            payload = json.loads(raw)
            tid = payload.get("transactionId", "?")
            result = _run_prediction(payload)
            producer.produce(TOPIC_SCORED, key=tid.encode(), value=json.dumps(result).encode())
            producer.flush()
            logger.info("Scored txn %s", tid)
        except Exception:
            logger.exception("Error processing Kafka message")


def start_kafka_worker() -> None:
    threading.Thread(target=_consumer_loop, daemon=True).start()
    logger.info("Kafka worker thread started")
