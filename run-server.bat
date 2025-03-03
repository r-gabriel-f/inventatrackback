@echo off
build\inventario-server.exe > error.log 2>&1
if %errorlevel% neq 0 (
    exit /b %errorlevel%)
