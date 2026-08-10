# Ajax Academy Microservices

This workspace contains a microservice architecture for Ajax Academy.

## Services

- `identity-service`: registration, login, JWT auth, identity events.
- `course-service`: course catalog, syllabus, resources, course events.
- `enrollment-service`: student enrollment, subscription, purchase tracking.
- `progress-service`: lecture completion, quiz score logging, certificates.
- `notification-service`: email/push/reminder notifications and event processing.
- `api-gateway`: gateway routing client requests to the correct microservice.

## Run locally with Docker Compose

1. Install Docker Desktop.
2. From the repo root:

```bash
docker compose up --build
```

3. The gateway will be available at `http://localhost:4000`.

## Example routes

- `POST /auth/register`
- `POST /auth/login`
- `GET /courses`
- `POST /courses`
- `POST /enrollments`
- `POST /progress`
- `POST /notifications/email`

## Notes

- Each service is currently in-memory.
- Replace each service with a dedicated database as needed.
- Events are published from services to `notification-service`.
