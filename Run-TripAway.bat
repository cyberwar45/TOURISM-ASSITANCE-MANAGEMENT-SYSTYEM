@echo off
setlocal
cd /d "%~dp0"

set "TRIPAWAY_URL=http://127.0.0.1:8125/"
powershell -NoProfile -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 8125); exit 0 } catch { exit 1 } finally { $client.Dispose() }" >nul 2>&1
if not errorlevel 1 goto open_site

where python >nul 2>&1
if errorlevel 1 (
    echo.
    echo Python was not found. Install Python 3, then try again.
    pause
    exit /b 1
)

echo Starting TripAway's local server...
start "TripAway Local Server" cmd /k python -m http.server 8125 --bind 127.0.0.1

for /l %%i in (1,1,15) do (
    powershell -NoProfile -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 8125); exit 0 } catch { exit 1 } finally { $client.Dispose() }" >nul 2>&1
    if not errorlevel 1 goto open_site
    timeout /t 1 /nobreak >nul
)

echo.
echo The local server did not start. Port 8125 may be blocked or already
echo occupied by another program. Close any old TripAway server window and retry.
pause
exit /b 1

:open_site
echo Opening TripAway at %TRIPAWAY_URL%
start "" "%TRIPAWAY_URL%"
exit /b 0
