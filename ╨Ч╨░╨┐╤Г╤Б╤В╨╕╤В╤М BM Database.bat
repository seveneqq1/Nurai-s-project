@echo off
chcp 65001 >nul

:: Автоматически запросить права администратора
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Открыть порт 8080 в брандмауэре
netsh advfirewall firewall show rule name="BM Database" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="BM Database" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
)

:: Запустить сервер
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
