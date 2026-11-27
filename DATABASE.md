# Base de datos — Clínica Dental Maró

## Requisitos

- XAMPP con Apache y MySQL/MariaDB activos.
- Node.js y pnpm.

## Instalación automática

1. Copia `.env.example` como `.env`.
2. Configura el acceso administrativo de XAMPP:

```env
DB_ROOT_USER=root
DB_ROOT_PASSWORD=
```

3. Define la contraseña del usuario limitado que utilizará la aplicación:

```env
DB_USER=inventario_app
DB_PASSWORD=una_clave_segura
DB_NAME=clinica_maro
```

4. Ejecuta:

```bash
pnpm db:init
```

Este comando crea la base `clinica_maro`, todas sus tablas InnoDB, claves
foráneas, restricciones, triggers, vistas, datos iniciales y el usuario
`inventario_app`. Este usuario no puede eliminar información de inventario.

## Instalación mediante phpMyAdmin

También puedes importar, en este orden:

1. `database/schema.sql`
2. `database/seed.sql`

Después debes crear el usuario de aplicación y otorgarle permisos de lectura,
inserción, actualización y ejecución sobre `clinica_maro`, además de eliminación
exclusivamente sobre la tabla `sessions`.

## Ejecución

- En Figma Make, el servidor Vite existente incorpora automáticamente `/api`.
- Para producción:

```bash
pnpm build
pnpm start
```

La API y el frontend se sirven desde el mismo origen.

## Cuentas iniciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@clinicamaro.cl` | `Maro2025` |
| Encargado de Bodega | `bodega@clinicamaro.cl` | `Bodega2025` |
| Comprador | `compras@clinicamaro.cl` | `Compras2025` |
| Auditor | `auditor@clinicamaro.cl` | `Auditor2025` |

Las contraseñas se almacenan como hash bcrypt. Deben cambiarse antes de utilizar
el sistema con información real.
