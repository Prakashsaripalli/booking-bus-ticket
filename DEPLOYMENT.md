# Yubus Deployment Guide

## Recommended setup

- One deployment for this Java service
- One managed MySQL database
- One SMTP account for OTP and booking emails
- HTTPS enabled by the hosting platform

The backend can serve the static frontend itself, so you do not need a separate frontend host unless you want one.

## Good hosting options

- Railway: simple for Java + MySQL
- Render: easy web service + managed database split
- VPS + Docker: most control

## Environment variables

Set these in your host:

```text
PORT=8000
FRONTEND_DIR=/app/Frontend
DB_URL=jdbc:mysql://<host>:3306/booking?useSSL=true&serverTimezone=UTC
DB_USER=<db-user>
DB_PASSWORD=<db-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_APP_PASSWORD=<smtp-app-password>
SMTP_FROM=<smtp-from-address>
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-admin-password>
SESSION_TIMEOUT_MINUTES=30
OTP_DEBUG=false
EMAIL_DEBUG=false
```

## Deploy with Docker

```bash
docker build -t yubus-app .
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e FRONTEND_DIR=/app/Frontend \
  -e DB_URL=jdbc:mysql://your-db-host:3306/booking?useSSL=true&serverTimezone=UTC \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e SMTP_USER=your-smtp-user \
  -e SMTP_APP_PASSWORD=your-smtp-password \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=change-this \
  yubus-app
```

## Before going live

1. Replace the mock payment flow with a real provider.
2. Replace the fake Google login with OAuth if you want social sign-in.
3. Move admin-managed bus data from browser storage into backend APIs and database tables.
4. Add rate limiting for OTP and login attempts.
5. Add monitoring and database backups.
