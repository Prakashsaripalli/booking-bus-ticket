# Backend Java (Servlet + DAO + Utils + JDBC)

This backend is fully Java-based and split by concern and feature:

- `servlet/` -> API endpoints (`login`, `otp`, `payment`)
- `dao/` -> JDBC database access
- `utils/` -> JSON, validation, response, OTP, JDBC helpers
- `model/` -> request and entity models

## Database (JDBC)

Default is MySQL JDBC:

- `DB_URL=jdbc:mysql://localhost:3306/booking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USER=root`
- `DB_PASSWORD=root123`

Runtime configuration:

- `PORT=8081`
- `ALLOWED_ORIGIN=*`

Tables are auto-created on startup: `users`, `otps`, `payments`.

### Email OTP (Gmail SMTP)

For email OTP delivery, set:

- `SMTP_USER=saisaripalli4988@gmail.com`
- `SMTP_APP_PASSWORD=<gmail-app-password>`
- `SMTP_FROM=saisaripalli4988@gmail.com` (optional)

Optional local-dev flags:

- `OTP_DEBUG=true` (returns the OTP in API response if SMTP is missing or delivery fails)
- `EMAIL_DEBUG=true` (skips notification email delivery and returns success for local testing)

## Run

```bash
mvn clean package
java -jar target/backend-java-1.0.0.jar
```

Server starts on: `http://localhost:8081`

For production hosting, set `PORT` from your hosting platform and set `ALLOWED_ORIGIN` to your frontend domain.

## APIs

- `POST /api/login`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/payment/process`
