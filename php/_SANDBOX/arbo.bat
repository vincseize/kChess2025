@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PYTHON_CMD="
py --version >nul 2>&1
if %errorlevel% equ 0 set "PYTHON_CMD=py"

if not defined PYTHON_CMD (
    python --version >nul 2>&1
    if %errorlevel% equ 0 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    if exist "C:\xampp\python\python.exe" set "PYTHON_CMD=C:\xampp\python\python.exe"
)

if not defined PYTHON_CMD (
    pause
    exit /b 1
)

%PYTHON_CMD% arbo.py

REM Fermeture immédiate
exit