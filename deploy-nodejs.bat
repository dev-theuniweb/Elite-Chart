@echo off
REM Bitcoin Trading Chart - Node.js Windows Deployment Script

echo ================================================
echo Bitcoin Trading Chart - Node.js Deployment
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)

echo npm version:
npm --version

REM Create deployment directory
set DEPLOY_DIR=C:\btc-chart-app
echo Creating deployment directory: %DEPLOY_DIR%
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"

REM Copy files
echo Copying application files...
xcopy /Y /E dist "%DEPLOY_DIR%\dist\"
copy /Y server.js "%DEPLOY_DIR%\"
copy /Y server-package.json "%DEPLOY_DIR%\package.json"

REM Change to deployment directory
cd /d "%DEPLOY_DIR%"

REM Install dependencies
echo Installing server dependencies...
npm install

REM Create Windows Service (optional)
echo.
echo To run as Windows Service, install node-windows:
echo npm install -g node-windows
echo Then create a service script.

echo.
echo ================================================
echo DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ================================================
echo.
echo Your Bitcoin Trading Chart is ready to run!
echo.
echo To start the server:
echo   cd "%DEPLOY_DIR%"
echo   npm start
echo.
echo The application will be available at:
echo   http://localhost:3000
echo   http://YOUR_SERVER_IP:3000
echo.
echo To run as background service, use PM2:
echo   npm install -g pm2
echo   pm2 start server.js --name "btc-chart"
echo   pm2 startup
echo   pm2 save
echo.

pause