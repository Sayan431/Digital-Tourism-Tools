@echo off
echo ========================================================
echo   Digital Tourism Management Platform (TourDesk OS)
echo ========================================================
echo.
echo Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "TourDesk OS - Backend Server" cmd /k "cd backend && python run_backend.py"

echo Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo Launching Vite React Frontend on http://localhost:5173 ...
start "TourDesk OS - Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate terminal windows.
echo Frontend Application: http://localhost:5173
echo Backend API Docs:     http://127.0.0.1:8000/api/docs
echo ========================================================

