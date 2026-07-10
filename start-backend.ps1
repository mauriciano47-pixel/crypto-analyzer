# Inicia el backend de Django en el puerto 8005
cd crypto-pattern-analyzer
if (Test-Path "venv\Scripts\activate.ps1") {
    . venv\Scripts\activate.ps1
}
python manage.py runserver 8005
