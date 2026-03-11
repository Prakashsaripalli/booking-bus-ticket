@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend-java"
set "JAR_PATH=%BACKEND_DIR%\target\backend-java-1.0.0.jar"
set "CLASSES_DIR=%BACKEND_DIR%\target\classes"
set "ENV_FILE=%BACKEND_DIR%\.env.bat"
set "JAVA_MODE=jar"
set "SHOULD_BUILD="

if exist "%ENV_FILE%" (
    call "%ENV_FILE%"
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8081 .*LISTENING"') do set "BACKEND_PID=%%P"
if defined BACKEND_PID (
    echo Backend already running on http://localhost:8081 (PID: %BACKEND_PID%)
    goto :eof
)

if not exist "%JAR_PATH%" (
    set "SHOULD_BUILD=1"
) else (
    for /f %%I in ('powershell -NoProfile -Command "$jar = Get-Item ''%JAR_PATH%''; $latestSource = Get-ChildItem ''%BACKEND_DIR%\src\main'' -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; $pom = Get-Item ''%BACKEND_DIR%\pom.xml''; if ($latestSource.LastWriteTime -gt $jar.LastWriteTime -or $pom.LastWriteTime -gt $jar.LastWriteTime) { ''1'' } else { ''0'' }"') do set "SHOULD_BUILD=%%I"
)

if "%SHOULD_BUILD%"=="1" (
    echo Backend sources changed. Building backend first...
    pushd "%BACKEND_DIR%"
    where mvn >nul 2>nul
    if not errorlevel 1 (
        call mvn clean package
        if errorlevel 1 (
            echo Build failed. Fix Maven errors and run again.
            popd
            exit /b 1
        )
    ) else (
        if not exist "%JAR_PATH%" (
            echo Maven is not installed and the backend jar is missing. Install Maven or build the backend once first.
            popd
            exit /b 1
        )

        echo Maven not found. Compiling Java sources into target\classes...
        if not exist "target\classes" mkdir "target\classes"
        powershell -NoProfile -Command "Get-ChildItem 'src\main\java' -Recurse -Filter *.java | ForEach-Object { $_.FullName } | Set-Content 'target\java-sources.txt'"
        javac -cp "target\backend-java-1.0.0.jar" -d "target\classes" @target\java-sources.txt
        if errorlevel 1 (
            echo Source compile failed. Fix Java errors and run again.
            popd
            exit /b 1
        )
        set "JAVA_MODE=classes"
    )
    popd
)

if "%SMTP_USER%"=="" (
    echo [Warning] SMTP_USER is not set. Email OTP may fail.
)
if "%SMTP_APP_PASSWORD%"=="" (
    echo [Warning] SMTP_APP_PASSWORD is not set. Email OTP may fail.
)

echo Starting Java backend...
if /I "%JAVA_MODE%"=="classes" (
    start "backend-java" /D "%BACKEND_DIR%" java -cp "target\classes;target\backend-java-1.0.0.jar" com.booking.backend.AppServer
) else (
    start "backend-java" /D "%BACKEND_DIR%" java -jar target\backend-java-1.0.0.jar
)

timeout /t 2 /nobreak >nul
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8081 .*LISTENING"') do set "BACKEND_PID=%%P"
if defined BACKEND_PID (
    echo Backend running on http://localhost:8081 (PID: %BACKEND_PID%)
) else (
    echo Backend started, but port 8081 is not listening yet. Wait a few seconds and retry.
)
