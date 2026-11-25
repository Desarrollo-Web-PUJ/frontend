"""Espera hasta que Angular y la API respondan a través del mismo origen."""
import os
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

base = os.getenv("E2E_BASE_URL", "http://localhost:4200").rstrip("/")
for intento in range(90):
    angular = False
    try:
        with urlopen(base + "/login", timeout=3) as pagina:
            angular = b"<app-root" in pagina.read()
        # La API rechaza una sesión anónima cuando Spring ya atiende peticiones.
        with urlopen(Request(base + "/api/auth/sesion"), timeout=3) as respuesta:
            estado = respuesta.status
    except URLError as error:
        estado = getattr(error, "code", None)
        if estado in (401, 403) and angular:
            print("Angular y Spring Boot listos en " + base)
            break
    time.sleep(2)
else:
    raise SystemExit("La aplicación no respondió a tiempo. Revisa la tarea de logs.")
