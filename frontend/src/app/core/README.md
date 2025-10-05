# Core Module

This folder contains singleton services, guards, and interceptors that are used throughout the application.

## Purpose
- **Services**: Application-wide singleton services (e.g., AuthService, ApiService)
- **Guards**: Route guards for authentication and authorization
- **Interceptors**: HTTP interceptors for request/response handling

## Guidelines
- Services here should be provided in 'root' (singleton pattern)
- Only app-wide core functionality belongs here
- Do NOT import feature-specific code

## Future Additions
- `services/auth.service.ts` - Authentication service
- `services/api.service.ts` - Base HTTP service
- `guards/auth.guard.ts` - Route guard for protected routes
- `interceptors/auth.interceptor.ts` - Add JWT tokens to requests
