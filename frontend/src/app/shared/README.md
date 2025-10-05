# Shared Module

This folder contains reusable components, directives, and pipes used across multiple features.

## Current Structure

### Components (`components/`)
Reusable UI components that can be used anywhere in the app.
- `header/` - Application header with navigation and user dropdown

### Layouts (`layouts/`)
Layout wrappers for consistent page structure.
- `main-layout/` - Main application layout with header and content projection

## Guidelines
- Components here should be **truly reusable** across features
- If a component is only used in one feature, keep it in that feature folder
- All shared components should use standalone: true
- Export components that will be used by features

## Future Additions
- `directives/` - Custom directives (e.g., tooltip, permission-based visibility)
- `pipes/` - Custom pipes (e.g., date formatting, currency)
- `models/` - Shared TypeScript interfaces and types
- `utils/` - Utility functions and helpers
