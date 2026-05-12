@echo off
echo ============================================
echo   SignEase - Starting All Services
echo ============================================
echo.

echo [1/3] Python vision service (port 8001)...
start "SignEase Python" cmd /k "cd /d D:\signease\python-service && python -m uvicorn main:app --host 0.0.0.0 --port 8001"

echo [2/3] Laravel API (port 8000)...
start "SignEase Laravel" cmd /k "cd /d D:\signease\backend && php artisan serve --port=8000"

echo [3/3] React frontend (port 5173)...
start "SignEase React" cmd /k "cd /d D:\signease\frontend && npm run dev"

echo.
echo ============================================
echo   Open: http://localhost:5173
echo.
echo   NOTE: First run requires training the ArSL model.
echo   See D:\signease\SETUP.txt for instructions.
echo ============================================
pause
