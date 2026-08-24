@echo off
title PCC - Personal Control Center (Desktop App Launcher)
echo.
echo ====================================
echo  Launching PCC Desktop Application
echo ====================================
echo.

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Rust toolchain (cargo) is not detected on your system.
    echo [!] Desktop (Tauri) requires Rust to be installed.
    echo [!] Please install Rust from https://rustup.rs/ and restart your terminal.
    echo.
    pause
    exit /b 1
)

cd frontend
npm run tauri dev
