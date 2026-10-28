@echo off
echo ===================================================
echo     STARTING ARMORSENSE COMMAND CENTER SERVERS
echo ===================================================
echo.
echo [1/2] Starting Backend FastAPI Server on Port 8000...
start "ARMORSENSE Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend Vite Server on Port 5173...
start "ARMORSENSE Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend API: http://127.0.0.1:8000
echo Frontend UI: http://localhost:5173
echo.
pause
