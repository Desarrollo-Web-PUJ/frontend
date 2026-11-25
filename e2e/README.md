# Pruebas Selenium del editor de procesos

Ejecutar en una instalación de pruebas. Cada caso registra empresas y cuentas con identificadores únicos. La suite conserva sus datos para inspección y nunca borra registros anteriores. El trabajo de CI crea y descarta su propia base.

## Ejecución local

Requiere Docker Compose, Chrome, Python 3.10 o superior y las carpetas hermanas `backend-jwt/` y `frontend/`. Desde `backend-jwt/`, configurar `.env` según el README del backend y arrancar el sistema.

```sh
docker compose up -d --build frontend
```

Cuando respondan http://localhost:4200/login y http://localhost:8080/v3/api-docs, ejecutar desde la raíz de `frontend/`.

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install -r e2e/requirements.txt
python -m pytest -q e2e --junitxml=e2e/evidencias/junit.xml
```

En PowerShell, activar con `.\.venv\Scripts\Activate.ps1`. Selenium Manager resuelve el controlador cuando Chrome está instalado. Para usar binarios propios, definir `E2E_CHROME` y `E2E_DRIVER` con las rutas absolutas. `E2E_BASE_URL` cambia el origen de la SPA (por defecto http://localhost:4200). `E2E_VISIBLE=1` permite ver el navegador durante la presentación.

## Evidencias y reproducción

El XML registra el estado y la duración por caso. Cada navegador deja una captura al terminar. En CI, abrir el trabajo **Selenium E2E** y descargar **evidencias-selenium**. El flujo se activa en solicitudes de integración y cambios a main, y permite ejecución manual. La revisión del backend se fija en el workflow para reproducir la combinación evaluada. La ejecución local documentada usa PostgreSQL, Spring Boot, el servidor Angular y Chrome sin interfaz.

Para demostrar el editor ante el docente, ejecutar solo el caso 02 con `python -m pytest -q e2e -k test_02`. El caso crea el rol Analista, dibuja una lane y una actividad, recarga el proceso y consulta su historial. El paquete de entrega incluye las capturas y el XML de referencia en e2e/evidencias/.
