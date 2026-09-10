@echo off
:: Request admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Open firewall port 8080
netsh advfirewall firewall show rule name="BM Database" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="BM Database" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
)

:: Start server silently in background
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command ^
    "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -WindowStyle Hidden -File ""%~dp0server.ps1""' -WindowStyle Hidden"

:: Open migration/launcher page (auto-migrates old data, then redirects to app)
start "" "%~dp0migrate.html"
