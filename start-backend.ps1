# Inicia el backend de Django en el puerto 8005
Set-Location crypto-pattern-analyzer
if (Test-Path "venv\Scripts\activate.ps1") {
    . venv\Scripts\activate.ps1
}
python manage.py runserver 8005
