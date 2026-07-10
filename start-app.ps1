# Inicia el backend en una nueva ventana
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File .\start-backend.ps1" -WorkingDirectory $PSScriptRoot

# Inicia el frontend en una nueva ventana
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File .\start-frontend.ps1" -WorkingDirectory $PSScriptRoot
