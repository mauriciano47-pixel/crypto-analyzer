# Inicia el túnel del Backend en el puerto 8005 con subdominio fijo
Start-Process powershell -ArgumentList "-NoExit -Command `"ssh -o StrictHostKeyChecking=no -R cryptoanalyzer-backend:80:127.0.0.1:8005 serveo.net`"" -WorkingDirectory $PSScriptRoot

# Inicia el túnel del Frontend en el puerto 3005 con subdominio fijo
Start-Process powershell -ArgumentList "-NoExit -Command `"ssh -o StrictHostKeyChecking=no -R cryptoanalyzer-frontend:80:127.0.0.1:3005 serveo.net`"" -WorkingDirectory $PSScriptRoot
