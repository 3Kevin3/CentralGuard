<<<<<<< HEAD
# CentralGuard — Paneles Supervisor y Administrador

Proyecto React + Vite + Supabase.

## Corrección de la versión anterior

Esta versión elimina las consultas con relaciones embebidas de PostgREST (`roles(...)`, `usuarios(...)`) que podían producir errores 404/400 cuando las claves foráneas no estaban expuestas correctamente en el esquema de Supabase.

El panel de Administrador ahora consulta directamente `usuarios` y `roles` y relaciona los datos en React mediante `idroles`.

También se eliminó la dependencia de la tabla `empleado`, porque esa tabla no es necesaria para mostrar la administración básica y puede no existir en el esquema real del proyecto.

## Panel Supervisor

- KPIs de novedades, prioridades, rondas y accesos.
- Filtro de novedades por prioridad.
- Cambio de estado de novedades.
- Resumen de rondas y accesos recientes.
- Conteo de pedidos y objetos en custodia.

## Panel Administrador

- Conteo de usuarios.
- Conteo por rol.
- Consulta de usuarios y roles.
- Buscador.
- Estado de conexión de las consultas principales.

## Instalación

```bash
npm install
npm run dev
```

## Supabase

El frontend utiliza estas tablas:

- `usuarios`
- `roles`
- `novedades`
- `ronda`
- `persona_acceso`
- `pedidos`
- `objetos_perdidos`

No requiere `empleado` para cargar los paneles.

> Nota de seguridad: el login existente compara la contraseña desde el cliente. Para producción debe migrarse a Supabase Auth y RLS/Policies.
=======
# CentralGuard
>>>>>>> 6baabfe916a968afb288806c6a3c9f1ef746e685
