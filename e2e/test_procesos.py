import os
from uuid import uuid4

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import Select, WebDriverWait


class Editor:
    def __init__(self, driver):
        self.driver = driver
        self.base = os.getenv("E2E_BASE_URL", "http://localhost:4200").rstrip("/")
        self.wait = WebDriverWait(driver, 15)

    def abrir(self, ruta):
        self.driver.get(self.base + ruta)

    def ver(self, selector):
        return self.wait.until(ec.visibility_of_element_located((By.CSS_SELECTOR, selector)))

    def texto(self, selector, esperado):
        self.wait.until(ec.text_to_be_present_in_element((By.CSS_SELECTOR, selector), esperado))

    def escribir(self, selector, valor):
        campo = self.ver(selector)
        campo.clear()
        campo.send_keys(valor)

    def pulsar(self, nombre):
        selector = f"//button[normalize-space(.)='{nombre}'] | //a[normalize-space(.)='{nombre}']"
        self.wait.until(ec.element_to_be_clickable((By.XPATH, selector))).click()

    def registrar(self):
        sufijo = uuid4().hex[:12]
        correo = f"admin-{sufijo}@example.org"
        clave = uuid4().hex
        self.abrir("/registro")
        for campo, valor in {
            "nombre": f"Empresa {sufijo}", "nit": str(int(sufijo, 16)),
            "correoContacto": correo, "adminNombre": "Administradora E2E",
            "adminCorreo": correo, "adminPassword": clave, "confirmarPassword": clave,
        }.items():
            self.escribir("#" + campo, valor)
        self.pulsar("Registrar empresa")
        self.texto("[role=status]", "Empresa registrada correctamente")
        return correo, clave

    def ingresar(self, correo, clave):
        self.escribir("#correo", correo)
        self.escribir("#contrasena", clave)
        self.pulsar("Iniciar sesión")
        self.texto("main h1", "Procesos")

    def salir(self):
        self.pulsar("Cerrar sesión")
        self.ver("#contrasena")

    def crear_proceso(self, nombre):
        self.pulsar("Crear proceso")
        self.escribir("form.tarjeta #nombre", nombre)
        self.escribir("#categoria", "Compras")
        self.pulsar("Guardar proceso")
        self.pulsar(nombre)
        self.ver(f'svg[aria-label="Diagrama del proceso {nombre}"]')


@pytest.fixture
def app(driver):
    return Editor(driver)


def test_01_registro_sesion_y_salida(app):
    correo, clave = app.registrar()
    app.escribir("#correo", correo)
    app.escribir("#contrasena", "Incorrecta123")
    app.pulsar("Iniciar sesión")
    app.texto("[role=alert]", "Correo o contraseña incorrectos")
    app.ingresar(correo, clave)
    app.driver.refresh()
    app.texto("main h1", "Procesos")
    app.salir()
    app.abrir("/procesos")
    app.ver("#contrasena")
    assert "/login" in app.driver.current_url


def test_02_edicion_y_visor_del_diagrama(app):
    app.ingresar(*app.registrar())
    app.pulsar("Roles de proceso")
    app.escribir("#nombre-rol", "Analista")
    app.pulsar("Crear rol")
    app.texto("tbody", "Analista")
    app.pulsar("Procesos")
    app.crear_proceso("Solicitud de compra")
    app.pulsar("+ Lane")
    app.wait.until(ec.presence_of_element_located((By.XPATH, "//select[@id='lane-rol']/option[.='Analista']")))
    Select(app.ver("#lane-rol")).select_by_visible_text("Analista")
    app.pulsar("Guardar")
    app.ver('svg [aria-label="Lane Analista"]')
    app.pulsar("+ Actividad")
    app.escribir("#actividad-nombre", "Revisar solicitud")
    Select(app.ver("#actividad-lane")).select_by_visible_text("Analista")
    app.pulsar("Guardar")
    actividad = 'svg [aria-label="Actividad Revisar solicitud"]'
    app.ver(actividad)
    app.driver.refresh()
    app.ver('svg [aria-label="Lane Analista"]')
    app.ver(actividad)
    app.pulsar("Historial de cambios")
    app.texto("tbody", "Revisar solicitud")
    app.pulsar("Diagrama")
    app.ver(actividad)


def test_03_edicion_y_baja_logica(app):
    app.ingresar(*app.registrar())
    app.crear_proceso("Compra inicial")
    app.pulsar("Editar datos del proceso")
    app.escribir("form.tarjeta #nombre", "Compra revisada")
    app.pulsar("Guardar proceso")
    app.texto("tbody", "Compra revisada")
    app.pulsar("Eliminar")
    app.pulsar("Confirmar eliminación")
    app.texto(".procesos-container .mensaje", "No se encontraron procesos")
    app.ver("input[type=checkbox]").click()
    app.pulsar("Buscar procesos")
    app.texto("tbody", "Compra revisada")
    assert app.ver("tbody .inactivo").text == "No"


def test_04_colaborador_solo_lectura(app):
    correo, clave = app.registrar()
    app.ingresar(correo, clave)
    app.crear_proceso("Consulta del lector")
    app.pulsar("Usuarios")
    lector = "lector-" + correo
    app.escribir("#nombre", "Lector E2E")
    app.escribir("#correo", lector)
    app.escribir("#password", clave)
    Select(app.ver("#rol")).select_by_value("LECTURA")
    app.pulsar("Registrar colaborador")
    app.texto("tbody", lector)
    app.salir()
    app.ingresar(lector, clave)
    app.pulsar("Consulta del lector")
    app.ver('svg[role="img"]')
    assert not app.driver.find_elements(By.CSS_SELECTOR, '[role="toolbar"]')
    app.abrir("/procesos/nuevo")
    app.texto("main h1", "Procesos")
    assert not app.driver.find_elements(By.LINK_TEXT, "Crear proceso")


def test_05_aislamiento_entre_empresas(app):
    app.ingresar(*app.registrar())
    app.crear_proceso("Proceso privado A")
    detalle = app.driver.current_url
    app.salir()
    app.ingresar(*app.registrar())
    app.texto(".procesos-container .mensaje", "No se encontraron procesos")
    app.driver.get(detalle)
    app.texto(".detalle-container [role=alert]", "no existe")
    assert not app.driver.find_elements(By.CSS_SELECTOR, 'svg[role="img"]')
