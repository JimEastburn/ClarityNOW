# ClarityNOW Development Guide

This file contains instructions for Claude Code to work effectively with the ClarityNOW project.

## Project Structure

This is a full-stack application with:
- **Client**: React + TypeScript + Vite frontend in `/client`
- **Server**: Express.js backend in `/server`

## Development Commands

### Client (React Frontend)
```bash
cd client
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
npm run test       # Run tests with Vitest
```

### Server (Express Backend)
```bash
cd server
# No specific scripts defined yet in package.json
```

## Key Technologies

### Frontend
- React 19.1.0
- TypeScript 5.8.3
- Vite 7.0.4
- ESLint for linting
- Vitest 3.2.4 for testing
- React Testing Library 16.3.0
- jsdom 26.1.0 for DOM simulation

### Backend
- Express.js 5.1.0
- TypeScript 5.8.3
- CORS enabled
- dotenv for environment variables
- Nodemon for development

## Testing

The client uses Vitest with React Testing Library for unit and integration tests:

```bash
cd client && npm run test
```

Test setup includes:
- Vitest as the test runner
- React Testing Library for component testing
- jsdom for DOM simulation
- @testing-library/jest-dom for additional matchers

## Linting, Type Checking, and Testing

For client code, always run these before completion:
```bash
cd client && npm run lint    # ESLint
cd client && npm run build   # TypeScript compilation
cd client && npm run test    # Run tests
```

## Notes for Claude

- This is a monorepo structure with separate client and server directories
- Always navigate to the appropriate directory before running commands
- The server package.json is minimal and may need additional scripts
- When making changes, verify with linting and building before completion