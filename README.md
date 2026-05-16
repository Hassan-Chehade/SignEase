# SignEase — Arabic Sign Language Translator

A real-time Arabic Sign Language (ArSL) detector that uses your webcam to recognize hand signs and translate them into Arabic letters.

**Stack:** React + Laravel + Python (FastAPI + MediaPipe)

---

## Before You Start — What You Need to Install

Install all of these first, in order. Each one has a link to the official download page.

### 1. Git
Used to download (clone) this project.
- Download: https://git-scm.com/downloads
- Click **"Download for Windows"** → run the installer → keep all defaults → Finish

### 2. Python 3.11
The AI vision service runs on Python.
- Download: https://www.python.org/downloads/release/python-3119/
- Scroll down to **"Files"** → click **"Windows installer (64-bit)"**
- **IMPORTANT during install:** Check the box that says **"Add Python to PATH"** before clicking Install Now

### 3. Node.js 20 LTS
Needed to run the React frontend.
- Download: https://nodejs.org/en/download
- Click the **"LTS"** version → Windows Installer → run it → keep all defaults → Finish

### 4. XAMPP
Gives you PHP and MySQL together — no need to install them separately.
- Download: https://www.apachefriends.org/download.html
- Click the **Windows** download for the latest version → run the installer → keep all defaults → Finish
- After install, add PHP to your system PATH so you can use it in Command Prompt:
  1. Press `Windows + S` → search **"Environment Variables"** → click "Edit the system environment variables"
  2. Click **"Environment Variables..."** at the bottom
  3. Under **"System variables"**, find **"Path"** → click **"Edit"**
  4. Click **"New"** → type `C:\xampp\php` → click OK on all windows
- Open `C:\xampp\php\php.ini` in Notepad and remove the `;` at the start of these lines:
  ```
  extension=fileinfo
  extension=mbstring
  extension=openssl
  extension=pdo_mysql
  ```

### 5. Composer (PHP package manager)
- Download: https://getcomposer.org/Composer-Setup.exe
- Run the installer → when it asks for the PHP path, point it to `C:\xampp\php\php.exe` → keep all other defaults → Finish

---

## Step-by-Step Setup

### Step 1 — Clone the Project

> **IMPORTANT:** The project must be placed at `D:\signease`. Make sure you have a D: drive.

Open **Command Prompt** (press `Windows + R`, type `cmd`, press Enter) and run:

```
D:
git clone https://github.com/YOUR_USERNAME/signease.git D:\signease
```

*(Replace `YOUR_USERNAME/signease` with the actual GitHub link — ask the person who shared this with you)*

### Step 2 — Set Up the Python Service

In Command Prompt:

```
cd D:\signease\python-service
pip install -r requirements.txt
```

This will install all the AI/vision libraries. It may take a few minutes.

### Step 3 — Set Up the Laravel Backend

**First, create the database:**
1. Open XAMPP Control Panel → start **Apache** and **MySQL**
2. Open your browser and go to `http://localhost/phpmyadmin`
3. Click **"New"** on the left → type `signease` as the database name → click **"Create"**

**Then open the `.env` file** (at `D:\signease\backend\.env`) in Notepad and find these lines:

```
DB_CONNECTION=sqlite
```

Replace them with:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=signease
DB_USERNAME=root
DB_PASSWORD=
```

**Then run these commands** in Command Prompt:

```
cd D:\signease\backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

Run these one at a time, in order. Each one should finish without red error messages.

> **Note:** Make sure XAMPP's Apache and MySQL are running every time you use the app.

### Step 4 — Set Up the React Frontend

In Command Prompt:

```
cd D:\signease\frontend
npm install
```

---

## Running the Project

After setup is done, all you need to do to start the app is:

**Double-click** `D:\signease\start.bat`

This opens 3 terminal windows (one for Python, one for Laravel, one for React). Wait about 10 seconds for them all to start, then open your browser and go to:

```
http://localhost:5173
```

---

## First Time Using the App

1. Click **"Register"** and create your account
2. The **very first account** created automatically becomes the Admin
3. Sign in and allow camera access when your browser asks
4. Show your hand to the webcam — the app will detect Arabic sign language letters in real time

---

## Running the Project After the First Time

Just double-click `start.bat` — setup only needs to be done once.

To stop the app, close the 3 terminal windows that `start.bat` opened.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` is not recognized | Python wasn't added to PATH — reinstall Python and check "Add to PATH" |
| `php` is not recognized | PHP wasn't added to PATH — see Step 4 (XAMPP) in prerequisites above |
| `composer` is not recognized | Restart Command Prompt after installing Composer |
| `npm` is not recognized | Restart Command Prompt after installing Node.js |
| Camera not working | Make sure your browser has camera permission (check the address bar for a camera icon) |
| `arsl_model.pkl` not found | Run `python train.py` again from `D:\signease\python-service` |
| Port already in use | Restart your PC and try again |

---

## Project Structure (for the curious)

```
D:\signease\
├── frontend/        ← React app (what you see in the browser)
├── backend/         ← Laravel API (handles users, history, admin)
├── python-service/  ← FastAPI + MediaPipe (the AI that reads your hand)
│   ├── main.py          ← the API server
│   ├── train.py         ← run once to train the model
│   └── requirements.txt ← Python libraries needed
├── start.bat        ← starts all 3 services at once
└── setup.bat        ← helper for re-running setup steps
```

## Ports Used

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend (Laravel) | http://localhost:8000 |
| AI Service (Python) | http://localhost:8001 |
