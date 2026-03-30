"""
Kafka-based async SHAP computation.

Consumes from 'transactions.pending-shap', computes SHAP explanations,
publishes results to 'transactions.shap-completed'.

Run:  uv run python shap_worker.py
"""

import json
import logging
import os
import time

import lightgbm as lgb
from confluent_kafka import Consumer, Producer

from schemas import Transaction, parse_ts
from core.features import compute_features, prepare_model_input, MODEL_FEATURE_ORDER
from core.explainability import compute_shap_values

logger = logging.getLogger(__name__)

_dir = os.path.dirname(__file__)
model = lgb.Booster(model_file=os.path.join(_dir, "models", "lightgbm_model.txt"))

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
PENDING_TOPIC = "transactions.pending-shap"
COMPLETED_TOPIC = "transactions.shap-completed"


def _process_message(event: dict, producer: Producer):
    transaction_id = event.get("id", "unknown")
    try:
        txn = Transaction(**event)
        curr_time = parse_ts(txn.timestamp).timestamp() if txn.timestamp else time.time()
        input_df = prepare_model_input(compute_features(txn, curr_time, []))

        t0 = time.perf_counter()
        shap_dict = compute_shap_values(model, input_df, MODEL_FEATURE_ORDER)
        logger.info("SHAP for %s took %.2f ms", transaction_id, (time.perf_counter() - t0) * 1000)

        result = {
            "transactionId": transaction_id,
            "shap": {
                "baseValue": shap_dict["base_value"],
                "shapValues": shap_dict["shap_values"],
                "topFeatures": [
                    {"feature": f["feature"], "label": f["label"],
                     "shapValue": f["shap_value"], "featureValue": f.get("feature_value")}
                    for f in shap_dict["top_features"]
                ],
            },
        }
        
        producer.produce(COMPLETED_TOPIC, key=str(transaction_id), value=json.dumps(result).encode())
        producer.flush()
        logger.info("SHAP completed for transaction %s", transaction_id)
    except Exception:
        logger.exception("Failed to compute SHAP for transaction %s", transaction_id)


def _consumer_loop():
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BOOTSTRAP,
        "group.id": "fraud-service-shap",
        "auto.offset.reset": "earliest",
    })
    producer = Producer({"bootstrap.servers": KAFKA_BOOTSTRAP})
    consumer.subscribe([PENDING_TOPIC])
    logger.info("SHAP consumer started — listening on '%s'", PENDING_TOPIC)

    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            logger.error("Kafka error: %s", msg.error())
            continue
        raw = msg.value()
        if raw is None:
            continue
        _process_message(json.loads(raw.decode()), producer)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    _consumer_loop()
