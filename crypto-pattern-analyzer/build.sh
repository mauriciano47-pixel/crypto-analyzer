#!/usr/bin/env bash
# Salir si ocurre cualquier error
set -o errexit

echo "Instalando dependencias..."
pip install -r requirements.txt

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --no-input

echo "Ejecutando migraciones..."
python manage.py migrate
