"""
Kafka-based async SHAP computation.

Consumes from 'transactions.pending-shap', computes SHAP explanations,
publishes results to 'transactions.shap-completed'.

Run:  uv run python shap_worker.py
"""

import json
import logging
import math
import os
import time

import lightgbm as lgb
from confluent_kafka import Consumer, Producer

from schemas import Transaction, parse_ts
from core.features import compute_features, MODEL_FEATURE_ORDER
from core.explainability import compute_shap_values
from core.model_artifacts import load_artifacts, encode_row

logger = logging.getLogger(__name__)

_dir = os.path.dirname(__file__)
_model_dir = os.path.join(_dir, "models")

model = lgb.Booster(model_file=os.path.join(_model_dir, "student_distilled.txt"))
_cat_lookups, _threshold = load_artifacts(os.path.join(_model_dir, "inference_artifacts.json"))

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
PENDING_TOPIC = "transactions.pending-shap"
COMPLETED_TOPIC = "transactions.shap-completed"


def _sanitize(obj):
    """Replace NaN/Inf with None so json.dumps produces valid JSON."""
    if isinstance(obj, float) and not math.isfinite(obj):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


def _process_message(event: dict, producer: Producer):
    transaction_id = event.get("id", "unknown")
    try:
        txn = Transaction(**event)
        curr_time = parse_ts(txn.timestamp).timestamp() if txn.timestamp else time.time()
        features = compute_features(txn, curr_time, [])
        encoded = encode_row(features, MODEL_FEATURE_ORDER, _cat_lookups)

        t0 = time.perf_counter()
        shap_dict = compute_shap_values(model, encoded, MODEL_FEATURE_ORDER, features)
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
        
        producer.produce(COMPLETED_TOPIC, key=str(transaction_id), value=json.dumps(_sanitize(result)).encode())
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
