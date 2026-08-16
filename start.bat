@echo off
title PCC - Personal Control Center (Local Dev)
echo.
echo  ====================================
echo   PCC - Personal Control Center
echo   Starting Local Development Server
echo  ====================================
echo.

:: Check if backend virtual environment exists
if not exist "backend\.venv\Scripts\activate.bat" (
    echo [!] Backend virtual environment not found.
    echo [!] Please run: cd backend ^&^& python -m venv .venv ^&^& .venv\Scripts\activate ^&^& pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

:: Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [!] Frontend dependencies not installed.
    echo [!] Please run: cd frontend ^&^& npm install
    echo.
    pause
    exit /b 1
)

:: Initialize database if not exists
if not exist "backend\pcc.db" (
    echo [*] Initializing SQLite database...
    cd backend
    call .venv\Scripts\activate.bat
    python -m alembic upgrade head
    cd ..
    echo [+] Database initialized successfully.
    echo.
)

echo [1/3] Starting Backend API Server (port 8000)...
start "PCC Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

echo [2/3] Starting Background Worker...
start "PCC Worker" cmd /k "cd backend && call .venv\Scripts\activate.bat && python -m worker.main"

:: Wait briefly
timeout /t 2 /nobreak > nul

echo [3/3] Starting Frontend Dev Server (port 5173)...
start "PCC Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo  ====================================
echo   All services started!
echo  ====================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Press any key to close this launcher.
echo   (The server windows will remain open)
echo.
pause
