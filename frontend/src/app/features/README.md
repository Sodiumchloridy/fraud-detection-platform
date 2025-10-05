# Features Module

This folder contains feature modules organized by business domain.

## Current Features

### 1. Auth (`auth/`)
Authentication and authorization features.
- `login/` - User login page

### 2. Dashboard (`dashboard/`)
Main fraud detection dashboard and related views.
- `dashboard/` - Main transaction feed and statistics
- `high-risk-alerts/` - Filtered high-risk transactions view
- `transaction-details/` - Detailed transaction analysis

### 3. Settings (`settings/`)
User account and application settings.
- `settings/` - User profile and MFA configuration

## Structure Guidelines
Each feature should be self-contained with:
- Components specific to that feature
- Services used only within that feature (shared services go in `core/`)
- Models/interfaces for that feature's data
- Feature-specific routing (if complex enough)

## Adding New Features
Create a new folder under `features/` and organize it similarly:
```
features/
└── new-feature/
    ├── component-a/
    ├── component-b/
    ├── services/
    └── models/
```
