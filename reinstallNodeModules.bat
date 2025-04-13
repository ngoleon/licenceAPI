@echo off
rmdir /s /q node_modules
del /f /q package-lock.json
call npm install
call npm prune --production
pause