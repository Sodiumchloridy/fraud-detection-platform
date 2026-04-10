> [!NOTE]
> This project is part of UECS3599 Final Year Project.

# Fraud Detection Platform
<img width="940" height="369" alt="image" src="https://github.com/user-attachments/assets/c526c07d-f588-40d3-b103-16177a54093f" />

A modern, scalable platform for real-time monitoring and analysis of fraudulent transactions. The system integrates a robust Java Spring Boot backend, an intuitive Angular frontend, and a highly performant Python-based AI service for automated fraud detection.

## System Architecture

The platform consists of three main services:

- **Frontend (Angular)**: A responsive management dashboard for analysts to monitor transactions, review risks, simulate POS transactions, and configure rules.
- **Backend (Spring Boot)**: A RESTful API that manages transactional data, user configurations, and orchestrates data flow between the UI and the AI engine.
- **Fraud Service (Python/FastAPI)**: An automated risk-scoring engine powered by Machine Learning (AutoGluon) with built-in interpretability (SHAP) and conversational AI explanations (LiteLLM).

## Key Features

- **Real-Time Fraud Detection**: Uses an ensemble ML architecture (CatBoost, LightGBM) integrated via AutoGluon to classify and score incoming transactions.
- **Explainable AI (XAI)**: Generates human-readable SHAP explanations and rule-based rationales highlighting why a transaction is flagged.
- **Dynamic Rule Management**: Analysts can adjust risk thresholds, define custom blocking rules, and manage platform configurations on the fly.
- **Interactive Dashboard**: View live transaction feeds, comprehensive risk statistics, and prioritize high-risk activities.
- **POS Simulator**: A built-in point-of-sale simulator to manually trigger and test transactions in real-time.

## Tech Stack

- **Frontend**: Angular 19+, TailwindCSS, TypeScript
- **Backend**: Java 21+, Spring Boot 3.5, Hibernate/JPA, H2 Database (Dev)
- **Fraud Service**: Python 3.12, FastAPI, AutoGluon, SHAP, Confluent Kafka, Redis, LiteLLM

## Quick Start

### Prerequisites
- Node.js 18+
- Java 21+
- Python 3.12+ (uv recommended)

### 1. Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run   # Linux/Mac
.\mvnw.cmd spring-boot:run  # Windows
```
*Runs on `http://localhost:8080`*

### 2. Frontend (Angular)
```bash
cd frontend
npm install
npm start
```
*Runs on `http://localhost:4200`*
*Default Login:* `admin` / `admin123`

### 3. Fraud Service (Python/FastAPI)
```bash
cd fraud-service
# Example using uv:
uv sync
uv run uvicorn main:app --reload
```
*Runs on `http://localhost:8000`*

## License

This project is developed for educational purposes as part of a final year project.
