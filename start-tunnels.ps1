# Inicia el túnel del Backend en el puerto 8005 con subdominio fijo usando localtunnel
Start-Process powershell -ArgumentList "-NoExit -Command `"npx localtunnel --port 8005 --subdomain cryptoanalyzer-backend`"" -WorkingDirectory $PSScriptRoot

# Inicia el túnel del Frontend en el puerto 3005 con subdominio fijo usando localtunnel
Start-Process powershell -ArgumentList "-NoExit -Command `"npx localtunnel --port 3005 --subdomain cryptoanalyzer-frontend`"" -WorkingDirectory $PSScriptRoot
