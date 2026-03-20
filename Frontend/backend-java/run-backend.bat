@echo off
REM Kill existing Java processes
taskkill /F /IM java.exe >nul 2>&1

REM Load environment files (ignore if missing)
if exist "db.env.bat" call db.env.bat
if exist "smtp.env.bat" call smtp.env.bat

REM Force backend port to 8000 for local runs
set "PORT=8000"

REM Prefer the shaded jar (includes dependencies)
set "JAR_PATH=target\backend-java-1.0.0.jar"

echo Starting Java Backend...
if exist "%JAR_PATH%" (
    java -jar "%JAR_PATH%"
) else (
    REM Fallback to classes (requires full classpath)
    set CLASSPATH=target/classes
    java -cp "%CLASSPATH%" com.booking.backend.AppServer
)

pause
