# Production Deployment Notes

## Active profile
- Use Spring profile `prod` for production deployments.  
  Example: `java -jar autoparts-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
- Liquibase migrations are executed automatically on startup; no manual `liquibase:update` is required.

## Required environment variables
- `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `RABBIT_HOST`, `RABBIT_PORT`, `RABBIT_USER`, `RABBIT_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION_MS`
- Optional tuning: `DATASOURCE_MAX_POOL`, `ASYNC_POOL_CORE`, `SERVER_TOMCAT_MAX_THREADS`, etc.

## Observability
- Actuator endpoints `health`, `info`, `metrics`, `prometheus` remain exposed.
- Health endpoint includes readiness/liveness probes (`/actuator/health/liveness`, `/actuator/health/readiness`).

## Security notes
- By default push integration with 1C over RabbitMQ is disabled in production (`integration.push.enabled=false`).
- Enable only when 1C REST endpoints are ready by setting environment variable `INTEGRATION_PUSH_ENABLED=true`.
