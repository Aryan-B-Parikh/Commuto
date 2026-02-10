@echo off
cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo Starting frontend server...
call npm run dev
