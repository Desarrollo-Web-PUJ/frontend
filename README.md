# Frontend Angular

Interfaz del editor de procesos empresariales. Las peticiones usan `/api` y la cookie de sesión del servidor.

## Ejecutar

```bash
npm ci
npm start -- --proxy-config proxy.conf.json
```

Abre http://localhost:4200. El proxy dirige las peticiones al backend en http://localhost:8080.

## Pantallas disponibles

| Ruta | Función | Acceso |
| --- | --- | --- |
| `/login` | Iniciar sesión con correo y contraseña. | Público |
| `/procesos` | Buscar, filtrar y paginar procesos; confirmar su eliminación lógica. | Usuarios autenticados; solo el administrador elimina. |
| `/usuarios` | Registrar colaboradores, cambiar roles y desactivar cuentas. | Administrador |
| `/procesos/nuevo` | Crear un proceso con nombre, descripción y categoría. | Administrador y editor |
| `/procesos/:id/editar` | Cargar y modificar los datos y el estado de un proceso. | Administrador y editor |

Crear y editar comparten un mismo componente. Al crear, la API asigna el estado `BORRADOR`. Los procesos inactivos se pueden listar, pero no editar.

## Explicación sencilla del código

- `models`: describe los datos que intercambiamos con el servidor.
- `services`: envía las peticiones HTTP con la cookie de sesión.
- `guards`: controla qué rutas puede visitar cada rol; el servidor valida los permisos reales.
- `pages`: contiene la lógica, los formularios y las tablas de cada pantalla.
- `shared/error-api.ts`: convierte los errores de la API en mensajes legibles.
- `shared/gestion.css`: comparte el estilo entre los formularios nuevos.

El listado enlaza a usuarios y a crear o editar procesos. Los formularios revisan los campos antes de enviarlos y conservan la información si el servidor devuelve un error. La eliminación de procesos y la desactivación de usuarios requieren confirmación en pantalla.

El rol y la empresa obtenidos en el login se conservan en `sessionStorage` para mantener la navegación al recargar. No se guardan contraseñas. Si ya había una sesión abierta antes de esta actualización, inicia sesión nuevamente para cargar esos datos. No existe un endpoint de consulta de sesión en la API actual.

Los cambios de rol se aplican en el siguiente inicio de sesión del colaborador, porque el backend conserva el rol en la sesión. La pantalla evita modificar la propia cuenta administrativa.

## Verificación

```bash
npm run build
npm test -- --watch=false
```

Las pruebas usan respuestas HTTP simuladas para comprobar formularios, permisos de navegación, filtros, creación, edición, eliminación y gestión de usuarios. La integración con un servidor real requiere iniciar el backend y entrar con una cuenta de prueba.
