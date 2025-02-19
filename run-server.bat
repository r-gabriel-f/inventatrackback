echo Starting server...
build\inventario-server.exe
if %errorlevel% neq 0 (
    echo Server execution failed. Check error.log for details.
    pause
)
