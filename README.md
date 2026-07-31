> [!NOTE]
> This project is part of the UECS3599 Final Year Project.

# Fraud Detection Platform
A full-stack platform for monitoring transactions, scoring fraud risk, reviewing flagged activity, and testing payment scenarios through a POS simulator.

| Dashboard | Transaction Monitoring |
| --- | --- |
| <img width="2517" height="1228" alt="image" src="https://github.com/user-attachments/assets/e2f6cf78-2127-4514-b91c-99d4209fcda7" /> | <img width="2037" height="1223" alt="image" src="https://github.com/user-attachments/assets/cd0eda31-013a-431d-b46c-ce3e1fe0ba2f" /> |

## Architecture

- **Frontend**: Angular dashboard for analysts, admins, transaction review, rules, settings, and POS simulation.
- **Backend**: Spring Boot API for authentication, transaction data, rule configuration, and service orchestration.
- **Fraud Service**: FastAPI risk engine with ML scoring, Redis-backed features, Kafka integration, SHAP explanations, and LiteLLM chat support.

## Features

- Real-time fraud scoring and transaction monitoring
- Explainable risk results with rules and SHAP insights
- Configurable thresholds, rules, users, and platform settings
- Analyst dashboard for reviewing flagged transactions
- POS simulator for testing payment flows

## Tech Stack

- **Frontend**: Angular 19, TypeScript, TailwindCSS
- **Backend**: Java 17, Spring Boot 3.5, Spring Security, JPA, PostgreSQL/H2
- **Fraud Service**: Python 3.12, FastAPI, Redis, Kafka, LightGBM, LiteLLM

## Quick Start

### Prerequisites

- Node.js 18+
- Java 17+
- Python 3.12
- uv for Python dependency management
- Redis on `localhost:6379` for rolling fraud features
- Kafka-compatible broker on `localhost:9094` for async SHAP jobs

### Infrastructure

- **Redis** stores rolling transaction features for the fraud service. Configure with `REDIS_HOST` and `REDIS_PORT` if not using `localhost:6379`.
- **Kafka** handles async SHAP explanation jobs between the backend and fraud service. Configure the fraud service with `KAFKA_BOOTSTRAP_SERVERS`; the backend uses `spring.kafka.bootstrap-servers` in `backend/src/main/resources/application.properties`.
- Kafka topics: `transactions.pending-shap` and `transactions.shap-completed`.
- **Postgres** is the main database for the backend. Requires a running instance (adjust `.env` in `backend` as needed).

### Environment Setup

Create `.env` files in both the `backend` and `fraud-service` directories, using the provided `.env.example` templates as a starting point.

Make sure that the `FRAUD_SERVICE_API_KEY` matches in both environment files so that the backend can successfully authenticate with the fraud service. You will also need to provide your `GROQ_API_KEY` for the LLM features. Note: In the `backend` folder's `.env`, the value set for `DATABASE_URL` will be appended to `jdbc:postgresql://`.

### Install Dependencies

From the project root (automatically installs Node and Python `uv` dependencies for all modules):

```bash
npm install
```

### Run Services

From the project root:

#### Option A: One-Command with Docker Compose (Recommended)

```bash
docker compose up --build
```

#### Option B: Single Command Local Development (Without Docker)

```bash
npm run start:local
```


Service URLs:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080`
- Fraud Service: `http://localhost:8000`

Default login: `admin` / `admin123`

## License

Developed for educational purposes as part of a final year project.
