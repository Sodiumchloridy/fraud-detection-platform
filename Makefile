.PHONY: help start-angular start-spring start-fastapi start-shap-worker

# Requires: bash, node, java, uv
# Windows users: use WSL2 or Git Bash

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } ' $(MAKEFILE_LIST)

start-angular: ## Start Angular Frontend
	cd frontend && npm start

start-spring: ## Start Spring Boot Backend
	cd backend && ./mvnw spring-boot:run

start-fastapi: ## Start FastAPI Service
	cd fraud-service && uv run uvicorn main:app --reload

start-shap-worker: ## Start SHAP Worker
	cd fraud-service && uv run python shap_worker.py