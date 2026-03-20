@echo off
set "SMTP_HOST=smtp.gmail.com"
set "SMTP_PORT=587"
set "SMTP_USER=saisaripalli4988@gmail.com"
set "SMTP_APP_PASSWORD=fyzmsuhxrxyyjaoe"
set "SMTP_FROM=%SMTP_USER%"

REM ===== GMAIL SETUP =====
REM 1. Enable 2FA on Gmail account
REM 2. Go to https://myaccount.google.com/apppasswords
REM 3. Generate new app password for "Mail" (16 chars no spaces)
REM 4. Replace SMTP_APP_PASSWORD above
REM =======================
REM Set to true to SKIP real emails, return OTP in API response for testing
set "OTP_DEBUG=false"
set "EMAIL_DEBUG=false"
REM =======================
