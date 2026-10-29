# Frontend · Editor y visualizador de procesos

SPA en Angular 22 para registrar empresas, gestionar usuarios y roles, y modelar visualmente procesos de negocio: pools, lanes, actividades, gateways, arcos y mensajes.
Se comunica con el backend por `/api`, usando la cookie de sesión del servidor.

## Ejecutar

**Con Docker.** El `docker-compose.yml` está en el repositorio del backend; ver su README. La aplicación queda en http://localhost:4200.

**En desarrollo.** Requiere Node 22.22+ o 24, y el backend en http://localhost:8080.

```bash
npm ci
npm start -- --proxy-config proxy.conf.json
```

Abra http://localhost:4200. El proxy reenvía `/api` al backend, igual que nginx en producción, así el navegador trabaja con un único origen.

**Imagen propia.** `Dockerfile` compila con Node 24 y sirve el resultado con nginx. `nginx.conf` hace tres cosas:

- reenvía `/api/` a `http://backend:8080`;
- devuelve `index.html` para las rutas de la SPA;
- cachea los archivos estáticos con hash.

## Pantallas

| Ruta | Función | Acceso |
| --- | --- | --- |
| `/login` | Iniciar sesión | Público |
| `/registro` | Registrar empresa y su administrador (HU-01) | Público |
| `/procesos` | Buscar, filtrar y paginar procesos; eliminación con confirmación (HU-06) | Autenticados; elimina el administrador |
| `/procesos/nuevo`, `/procesos/:id/editar` | Crear y editar procesos (HU-04, HU-05) | Administrador y editor |
| `/procesos/:id` | Diagrama, historial y compartición (HU-07 a HU-16, HU-21 a HU-28) | Autenticados; modelan administrador y editor |
| `/compartidos` | Procesos que otras empresas compartieron (HU-23) | Autenticados |
| `/roles` | Roles de proceso: búsqueda paginada, uso y CRUD (HU-17 a HU-20) | Consulta todos; gestiona el administrador |
| `/usuarios` | Registrar colaboradores, cambiar rol, desactivar (HU-02, HU-03) | Administrador |

Las rutas privadas cuelgan de `LayoutComponent` (barra de navegación) y se cargan de forma diferida (*lazy loading*).

## Estructura

```
src/app/
├── models/        interfaces tipadas de cada recurso de la API (Pagina<T>, ErrorApi, ProcesoDetalle, …)
├── services/      un servicio HTTP por recurso + api.interceptor
├── guards/        authGuard (sesión) y rolGuard (rol requerido)
├── shared/        componentes reutilizables, validadores y traducción de errores
├── pages/         una carpeta por pantalla
└── testing/       proveedores y datos de ejemplo para las pruebas
```

### Servicios y RxJS

- **Servicios por recurso.** Cada recurso tiene su servicio (`ProcesoService`, `ActividadService`, `LaneService`, …). Todos devuelven `Observable` tipados.
- **`apiInterceptor`.** Es un interceptor funcional:
  - añade `withCredentials` a todas las peticiones;
  - ante un 401, limpia la sesión y redirige a `/login?sesion=expirada`.
- **`AuthService`.** Guarda el usuario en una `signal`.
  - Al recargar la página, `cargarSesion()` lo consulta en `GET /api/auth/sesion`, así el rol mostrado siempre coincide con el del servidor.
  - `sessionStorage` solo agiliza el primer pintado. Nunca guarda contraseñas.
- **Operadores.** Se usan:
  - `finalize`, para los indicadores de carga;
  - `map` y `tap`, para adaptar las respuestas y actualizar la sesión;
  - `catchError` y `throwError`, en el interceptor y en los guards;
  - `takeUntilDestroyed`, para cancelar suscripciones a cambios de formulario.

### Componentes e información entre componentes

**Componentes compartidos** (`shared/components`). Usan `input()` / `output()`:

| Componente | Función |
| --- | --- |
| `app-paginador` | Paginación |
| `app-dialogo-confirmacion` | Confirmación antes de eliminar |
| `app-aviso` | Mensajes de éxito, error o advertencia |

**Vista del proceso** (`pages/proceso-detalle`). Separa contenedor y presentación:

- `ProcesoDetallePage` (contenedor):
  - carga el detalle;
  - coordina la selección;
  - recarga después de cada cambio.
- `DiagramaProceso` (presentación):
  - dibuja el diagrama en SVG;
  - emite `seleccionar` y `mover` (arrastrar y soltar con *pointer capture*).
- `diagrama-layout.ts`:
  - funciones puras de geometría (posiciones de pools, lanes, nodos y arcos);
  - probadas sin DOM.
- `diagrama-validacion.ts`: advierte incoherencias del modelo, por ejemplo una actividad sin arcos o un gateway con una sola salida.
- **Editores.** Hay un editor por tipo de elemento, todos sobre la clase base `EditorBase`:
  - entradas `detalle` y `soloLectura`;
  - salidas `guardado` y `cancelado`.

**Parámetros de ruta.** Llegan como `input()` gracias a `withComponentInputBinding()`.

### Formularios y paginación

- Todos los formularios son reactivos y tipados (`NonNullableFormBuilder`).
- Tienen validadores propios en `shared/validadores.ts`:
  - `noVacio`: rechaza un texto que solo tiene espacios;
  - `camposIguales`: exige que la contraseña y su confirmación coincidan.
- El evento de mensaje usa `FormArray` para sus campos dinámicos.
- Los errores de validación del backend (`{ mensaje, errores[] }`) se muestran campo por campo.
- Procesos y roles se paginan en el servidor con `Pagina<T>`.

## Pruebas

```bash
npm run build
npm test -- --watch=false
```

Hay 63 pruebas unitarias (Vitest) en 19 archivos. Usan respuestas HTTP simuladas (`HttpTestingController`) y cubren:

- servicios, interceptor y guards;
- formularios (crear o editar proceso, registro de empresa, roles, usuarios);
- paginación y confirmaciones;
- la geometría y la validación del diagrama;
- la pantalla de detalle con el proceso de vacaciones del enunciado.
