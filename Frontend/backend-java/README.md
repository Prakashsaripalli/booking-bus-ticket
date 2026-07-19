# Backend Java

Embedded Jetty + Servlet + JDBC backend for the Yubus booking project.

## What is production-ready now

- Static frontend can be served by the same Java process
- User login now requires password + OTP and creates a server-side session
- Admin login now uses environment variables instead of hardcoded credentials
- Profile, booking, payment, and notification APIs now require authenticated sessions
- Booking ownership is enforced on the backend

## What is still demo/mock behavior

- Payment collection is simulated; no Razorpay/Stripe/Paytm gateway is integrated yet
- Google login is not configured; the frontend now blocks the fake bypass flow
- Admin-created buses and feature toggles still live in browser storage, not the database

## Required environment variables

```text
PORT=8000
FRONTEND_DIR=/absolute/path/to/Frontend

DB_URL=jdbc:mysql://<host>:3306/booking?useSSL=true&serverTimezone=UTC
DB_USER=<database-user>
DB_PASSWORD=<database-password>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<smtp-username>
SMTP_APP_PASSWORD=<smtp-app-password>
SMTP_FROM=<from-email>

ADMIN_USERNAME=<admin-login-name>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<strong-admin-password>

SESSION_TIMEOUT_MINUTES=30
ALLOWED_ORIGIN=https://your-frontend-domain.example
OTP_DEBUG=false
EMAIL_DEBUG=false
```

## Local run

```bash
mvn clean package
java -jar target/backend-java-1.0.0.jar
```

If you run from `Frontend/backend-java`, the app can automatically serve the parent `Frontend` directory. You can also set `FRONTEND_DIR` explicitly.

## Docker

From the repository root:

```bash
docker build -t yubus-app .
docker run --rm -p 8000:8000 \
  -e PORT=8000 \
  -e FRONTEND_DIR=/app/Frontend \
  -e DB_URL=jdbc:mysql://host.docker.internal:3306/booking?useSSL=false&serverTimezone=UTC \
  -e DB_USER=youruser \
  -e DB_PASSWORD=yourpassword \
  -e SMTP_USER=your-smtp-user \
  -e SMTP_APP_PASSWORD=your-smtp-password \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=change-me \
  yubus-app
```

## Deployment checklist

1. Use a managed MySQL instance.
2. Set real SMTP credentials in host environment variables.
3. Set `ADMIN_PASSWORD`; admin login is disabled if it is blank.
4. Serve the app over HTTPS.
5. Keep `OTP_DEBUG=false` and `EMAIL_DEBUG=false` in production.
6. Integrate a real payment gateway before accepting live payments.
