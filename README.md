# API Workflow Engine

A flexible and powerful workflow engine for orchestrating API integrations and automating business processes.

## Features

- **Workflow Management**: Create, execute and monitor API workflows
- **Multi-tenant Architecture**: Support for multiple organizations with isolated data
- **Provider Integration**: Pre-built integrations with common API providers
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Retry Mechanisms**: Configurable retry policies for API calls
- **Template Support**: Dynamic request templating with variable substitution
- **Step Dependencies**: Define execution order with step dependencies
- **Swagger Documentation**: Auto-generated API documentation

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js with JWT
- **API Documentation**: Swagger/OpenAPI
- **HTTP Client**: Axios
- **Configuration**: Environment-based with dotenv

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=workflow_engine
DB_SSL=false

# API
API_PORT=3000
EXTERNAL_API_URL=http://localhost:4000
JWT_SECRET=your-secret-key
```

## Database Setup

```bash
# Run migrations
npm run typeorm migration:run

# (Optional) Seed initial data
npm run seed
```

## Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── auth/                 # Authentication module
├── config/              # Configuration files
├── migrations/          # Database migrations
├── providers/           # API provider integrations
├── seeds/               # Database seeders
├── tenants/            # Multi-tenant functionality
├── users/              # User management
├── utils/              # Utility functions
└── workflow/           # Core workflow engine
    ├── dto/            # Data transfer objects
    ├── entities/       # Database entities
    ├── interfaces/     # TypeScript interfaces
    └── services/       # Business logic
```

## API Documentation

Once the application is running, visit `/api` to access the Swagger documentation.

### Key Endpoints

- `POST /auth/login` - Authenticate user
- `GET /tenants` - List all tenants
- `POST /workflows` - Create new workflow
- `POST /workflows/:id/execute` - Execute workflow
- `GET /workflows/:id` - Get workflow details

## Environment Configuration

The application supports different environments through `.env` files:

- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.test` - Testing environment

## Workflow Definition

Example workflow definition:

```json
{
  "name": "UserSync",
  "tenantId": "tenant-id",
  "steps": [
    {
      "stepName": "GetUsers",
      "method": "GET",
      "url": "https://api.provider.com/users",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "output": {
        "users": "$.data"
      }
    },
    {
      "stepName": "ProcessUsers",
      "method": "POST",
      "url": "https://api.internal.com/sync",
      "body": {
        "users": "{{GetUsers.users}}"
      },
      "dependsOn": ["GetUsers"]
    }
  ]
}
```

## Error Handling

The application implements comprehensive error handling:

- HTTP error responses with appropriate status codes
- Detailed error messages for debugging
- Automatic retry for failed API calls
- Error logging and monitoring

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Run database migrations
4. Start the application:
```bash
npm run start:prod
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.


npm run migration:generate src/migrations/FixExecutionLogRelations
npm run migration:generate -- src/migrations/FixExecutionLogRelations
npm run migration:revert

npm run migration:run
