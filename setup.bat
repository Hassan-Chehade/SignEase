@echo off
echo ============================================
echo  SignEase - First-Time Setup
echo ============================================
echo.

echo [Step 1/3] Installing Python dependencies...
echo This downloads the ASL model from HuggingFace on first run (~300MB).
cd /d D:\signease\python-service
pip install -r requirements.txt
echo Done.
echo.

echo [Step 2/3] Laravel is already set up.
cd /d D:\signease\backend
php artisan migrate --force
echo Done.
echo.

echo [Step 3/3] React frontend dependencies are already installed.
echo.
echo ============================================
echo  Setup complete! Run start.bat to launch.
echo ============================================
pause
