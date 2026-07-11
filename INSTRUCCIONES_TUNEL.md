# Instrucciones para el Túnel Público de Crypto Analyzer 🪙

Este archivo documenta la configuración y los comandos necesarios para exponer la aplicación **Crypto Analyzer** a internet de forma pública, solucionando los problemas de bloqueo de antivirus (AVG) y resolución de red en Windows.

---

## 🌐 URLs Públicas Actuales (Serveo)

* **Frontend**: `https://cryptoanalyzer-frontend.loca.lt`
* **Backend (API)**: `https://cryptoanalyzer-backend.loca.lt`

---

## 🛠️ Cómo iniciar los túneles desde la terminal en Windows

Para levantar los túneles públicos de forma correcta en Windows sin fallos `502 Bad Gateway`, se debe usar la IP explícita `127.0.0.1` en lugar de `localhost`. Abre dos terminales independientes y ejecuta:

### 1. Túnel del Backend (Puerto 8005):
```bash
npx localtunnel --port 8005 --subdomain cryptoanalyzer-backend
```

### 2. Túnel del Frontend (Puerto 3005):
```bash
npx localtunnel --port 3005 --subdomain cryptoanalyzer-frontend
```

---

## 🔒 Solución a los Errores de Red ("Failed to Fetch" / "No se pudo obtener")

Los túneles gratuitos de Serveo muestran una advertencia intermedia anti-phishing al acceder por primera vez. Esto rompe las llamadas asíncronas AJAX (Preflight OPTIONS) del navegador. 

Para que la aplicación funcione en cualquier computadora externa, se deben seguir estos pasos:

1. **Paso 1**: Visitar la URL del Backend en una pestaña del navegador:
   👉 `https://f1e59661ddb4a69d-195-86-38-45.serveousercontent.com`
2. **Paso 2**: En la advertencia gris de Serveo, hacer clic en el enlace para **continuar/proceder**. (Esto guarda una cookie de bypass en el navegador).
3. **Paso 3**: Entrar a la URL del Frontend:
   👉 `https://077dce2e836b2a2f-195-86-38-45.serveousercontent.com`
   *Si también muestra la advertencia, hacer clic en continuar.*
4. **Paso 4**: La aplicación cargará todos los datos, gráficos y análisis de forma automática.

---

## 💻 Cambios de Configuración Aplicados en el Código

1. **Frontend (`crypto-frontend/src/services/api.js`)**:
   * Se actualizó la constante `API_URL` con la dirección asignada por el túnel.
   * Se agregaron los headers de bypass `serveo-skip-browser-warning`, `ngrok-skip-browser-warning` y `bypass-tunnel-reminder` a todas las peticiones `fetch`.
2. **Backend (`crypto-pattern-analyzer/core/settings.py`)**:
   * Se agregaron los headers de bypass a la lista de `CORS_ALLOW_HEADERS` en la configuración de Django para permitir el tráfico de verificación CORS (Preflight).
3. **Configuración del Servidor Vite (`crypto-frontend/vite.config.js`)**:
   * Se configuró `server.allowedHosts: true` para evitar que Vite bloquee conexiones provenientes del subdominio de Serveo.
