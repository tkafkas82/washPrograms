@echo off
rem Starts the app on http://localhost:4720 and opens the browser.
cd /d "%~dp0"
start "" http://localhost:4720/
node serve.js
