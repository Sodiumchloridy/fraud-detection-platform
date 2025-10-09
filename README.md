# Fraud Detection System
<img width="940" height="369" alt="image" src="https://github.com/user-attachments/assets/c526c07d-f588-40d3-b103-16177a54093f" />

A full-stack web application prototype for monitoring and analyzing fraudulent transactions using Angular and Spring Boot.

## Project Structure

```
workshop-assignment/
├── backend/          # Spring Boot REST API
│   ├── src/main/java/com/workshop/backend/
│   │   ├── controller/    # REST endpoints
│   │   ├── model/         # JPA entities
│   │   ├── repository/    # Data access layer
│   │   └── exception/     # Error handling
│   └── src/main/resources/
│       ├── application.properties
│       └── data.sql       # Sample data
└── frontend/         # Angular application
    └── src/app/
        ├── core/          # Services & guards
        ├── features/      # Feature modules
        ├── shared/        # Reusable components
        └── pages/         # Static pages
```

## Features

### Backend (Spring Boot)
- **REST API** with CRUD operations for transactions
- **JPA/Hibernate** for database operations
- **Custom queries** for risk-based filtering
- **Global exception handling** with proper error responses
- **Bean validation** for data integrity
- **CORS configuration** for frontend integration
- **H2 in-memory database** for development

### Frontend (Angular)
- **Standalone components** architecture
- **Reactive data binding** with services
- **HTTP client** for API communication
- **Routing & navigation** for multi-page experience
- **Form validation** for user inputs
- **Responsive UI** with TailwindCSS

## Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- Maven (included via wrapper)

### Backend Setup

```bash
cd backend
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

Backend runs on: `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:4200`

## Usage

1. **Login** with credentials:
   - Username: `admin`
   - Password: `admin123`

2. **Dashboard** shows:
   - Transaction statistics
   - Live transaction feed
   - High-risk alerts count

3. **High-Risk Alerts** page displays transactions flagged as HIGH or CRITICAL risk

4. **Transaction Details** allows analysts to:
   - View complete transaction information
   - Mark transactions as legitimate or fraudulent
   - See fraud scores and risk levels

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions |
| GET | `/api/transactions/{id}` | Get transaction by ID |
| GET | `/api/transactions/high-risk` | Get HIGH/CRITICAL risk transactions |
| GET | `/api/transactions/stats` | Get transaction statistics |
| POST | `/api/transactions` | Create new transaction |
| PATCH | `/api/transactions/{id}/status` | Update transaction status |
| DELETE | `/api/transactions/{id}` | Delete transaction |
| POST | `/api/users/login` | User authentication |

## Technologies

**Backend:**
- Spring Boot 3.5.5
- Spring Data JPA
- Hibernate 6.6.26
- H2 Database 2.3.232
- Maven

**Frontend:**
- Angular 19.2.16
- TailwindCSS 3.4.17

## License

This project is for educational purposes.
