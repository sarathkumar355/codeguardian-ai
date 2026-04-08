@echo off
echo Starting Backend...
start cmd /k "cd backend && python main.py"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo CodeGuardian AI is starting up!
echo Backend will be available at http://localhost:8000
echo Frontend will be available at http://localhost:5173
pause
