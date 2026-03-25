# Deploy on Koyeb with Aiven MySQL

This project can be deployed as a single Koyeb web service.
Koyeb runs the Java backend, and the backend also serves the static frontend files from the repository root.

## What this setup uses

- Koyeb web service for the Java app
- Aiven MySQL for the database
- Gmail SMTP app password for OTP and email notifications

## 1. Push this project to GitHub

Koyeb deploys most easily from a GitHub repository.

If the project is not on GitHub yet:

1. Create a new GitHub repository.
2. Push the full project root, including `backend-java/`, HTML, CSS, JS, and `Assets/`.

## 2. Create the MySQL database on Aiven

1. Create an Aiven account.
2. Create a new `MySQL` service on the free tier.
3. Open the service overview and copy:
   - host
   - port
   - database name
   - username
   - password

Build the JDBC URL in this format:

```env
DB_URL=jdbc:mysql://YOUR_AIVEN_HOST:YOUR_AIVEN_PORT/defaultdb?sslMode=REQUIRED&serverTimezone=UTC
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD
```

Notes:

- Replace `defaultdb` if your Aiven service shows a different database name.
- `sslMode=REQUIRED` is recommended for Aiven.
- The backend creates required tables automatically on startup.

## 3. If you want your current local MySQL data

Export from local MySQL and import it into Aiven before deploying.

Example export:

```powershell
mysqldump -u root -p booking > booking.sql
```

Example import:

```powershell
mysql -h YOUR_AIVEN_HOST -P YOUR_AIVEN_PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < booking.sql
```

If you do not import anything, the app still starts and creates fresh tables.

## 4. Create the Koyeb web service

1. Sign in to Koyeb.
2. Click `Create App`.
3. Choose `GitHub`.
4. Select this repository.
5. Use the repository root as the project directory.
6. Koyeb should detect the `Dockerfile` in the root.
7. Create a `Web Service`.

No custom start command is needed because the `Dockerfile` already runs:

```text
java -jar backend-java/target/backend-java-1.0.0.jar
```

## 5. Add environment variables in Koyeb

Set these environment variables in the Koyeb service:

```env
DB_URL=jdbc:mysql://YOUR_AIVEN_HOST:YOUR_AIVEN_PORT/defaultdb?sslMode=REQUIRED&serverTimezone=UTC
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_GMAIL_ADDRESS
SMTP_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD
SMTP_FROM=YOUR_GMAIL_ADDRESS
ALLOWED_ORIGIN=*
```

Optional debug flags for testing only:

```env
OTP_DEBUG=false
EMAIL_DEBUG=false
```

Notes:

- Koyeb provides the `PORT` variable automatically.
- `ALLOWED_ORIGIN=*` is acceptable for initial deployment. Later, you can replace it with your Koyeb app URL or custom domain.

## 6. Deploy

After saving the environment variables:

1. Trigger deployment in Koyeb.
2. Wait for the build to finish.
3. Open the generated Koyeb URL.

Because the backend serves the frontend files too, the same Koyeb URL should load the website and the `/api/...` calls should work from the same origin.

## 7. Gmail setup for OTP and email

To make OTP and booking emails work:

1. Turn on 2-Step Verification in the Gmail account.
2. Create an App Password.
3. Put that value into `SMTP_APP_PASSWORD`.

Do not use your normal Gmail login password.

## 8. Quick verification after deploy

Check these flows on the Koyeb URL:

1. Home page loads.
2. Search routes works.
3. Login or signup works.
4. OTP send works.
5. Payment saves records in MySQL.
6. Profile page loads saved bookings.

## Troubleshooting

If the site loads but API calls fail:

- Confirm Koyeb environment variables are saved.
- Confirm the Aiven JDBC URL is correct.
- Confirm the Aiven service allows the connection and uses the correct port.

If email fails:

- Confirm `SMTP_USER` and `SMTP_APP_PASSWORD`.
- Confirm the Gmail App Password is used, not the account password.

If you want to point the frontend to another backend later:

```js
localStorage.setItem("yubusApiBase", "https://your-backend-url")
```

To remove that override:

```js
localStorage.removeItem("yubusApiBase")
```
