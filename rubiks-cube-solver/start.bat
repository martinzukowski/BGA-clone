@echo off
rem Serves the solver on http://localhost:8000 (browsers only allow camera access on localhost/https).
cd /d "%~dp0"
start "" http://localhost:8000/
python -m http.server 8000
