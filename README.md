# Sistema de Gestión de Inventario — Clínica Dental Maró

Sistema web para administrar el inventario clínico de Clínica Dental Maró,
ubicada en Temuco. Incluye control de productos, stock, lotes, vencimientos,
movimientos, alertas, órdenes de compra, usuarios, roles, configuración y
reportes.

## Tecnologías

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4

### Backend

- Node.js
- Express
- MySQL/MariaDB
- `mysql2`
- `bcryptjs`

### Base de datos

- MariaDB incluido en XAMPP
- Motor InnoDB
- Transacciones ACID
- Claves foráneas
- Restricciones `CHECK`
- Triggers
- Vistas SQL
- Administración mediante phpMyAdmin

---

## 1. Requisitos previos

Antes de comenzar debes instalar:

### Node.js

La versión recomendada se encuentra en `.mise.toml`. Si no utilizas Mise,
instala una versión reciente y estable de Node.js.

Puedes comprobar la instalación con:

```bash
node --version
```

### pnpm

Instala pnpm con:

```bash
npm install --global pnpm
```

Comprueba la instalación:

```bash
pnpm --version
```

### XAMPP

Descarga e instala XAMPP desde:

```text
https://www.apachefriends.org/
```

XAMPP proporciona:

- Apache
- MariaDB/MySQL
- phpMyAdmin

---

## 2. Descargar y preparar el proyecto

Entra a la carpeta del proyecto:

```bash
cd ruta/al/proyecto
```

Instala las dependencias:

```bash
pnpm install
```

---

## 3. Iniciar MariaDB en XAMPP

1. Abre el panel de control de XAMPP.
2. Busca el módulo **MySQL**.
3. Presiona **Start**.
4. Opcionalmente inicia **Apache** para acceder a phpMyAdmin.
5. Abre phpMyAdmin desde:

```text
http://localhost/phpmyadmin
```

El puerto predeterminado de MariaDB/MySQL es `3306`.

Si XAMPP utiliza otro puerto, debes indicarlo posteriormente en `DB_PORT`.

---

## 4. Configurar las variables de entorno

Copia el archivo de ejemplo:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Windows CMD

```cmd
copy .env.example .env
```

### Linux o macOS

```bash
cp .env.example .env
```

Abre `.env` y configura:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=inventario_app
DB_PASSWORD=cambia_esta_clave
DB_NAME=clinica_maro

DB_ROOT_USER=root
DB_ROOT_PASSWORD=

PORT=3000
```

### Significado de las variables

| Variable | Descripción |
| --- | --- |
| `DB_HOST` | Dirección del servidor MariaDB |
| `DB_PORT` | Puerto de MariaDB, normalmente `3306` |
| `DB_USER` | Usuario limitado utilizado por la aplicación |
| `DB_PASSWORD` | Contraseña del usuario de la aplicación |
| `DB_NAME` | Nombre de la base de datos |
| `DB_ROOT_USER` | Usuario administrador utilizado para crear la base |
| `DB_ROOT_PASSWORD` | Contraseña del usuario administrador de XAMPP |
| `PORT` | Puerto del servidor Node.js de producción |

En una instalación estándar de XAMPP, el usuario suele ser `root` y la
contraseña suele estar vacía. Si configuraste una contraseña en phpMyAdmin,
debes escribirla en `DB_ROOT_PASSWORD`.

No subas el archivo `.env` a Git.

---

## 5. Crear la base de datos automáticamente

Con MariaDB iniciado, ejecuta:

```bash
pnpm db:init
```

El comando realiza las siguientes acciones:

1. Crea la base de datos `clinica_maro`.
2. Crea las tablas con motor InnoDB.
3. Crea las claves foráneas y restricciones.
4. Crea los triggers de inventario.
5. Crea las vistas para reportes.
6. Carga productos, lotes, proveedores y alertas de ejemplo.
7. Crea los cuatro usuarios de prueba.
8. Crea el usuario limitado `inventario_app`.
9. Otorga los permisos mínimos necesarios.

El resultado esperado es:

```text
Base de datos clinica_maro creada y cargada correctamente.
```

---

## 6. Crear la base manualmente con phpMyAdmin

Utiliza esta alternativa si no puedes ejecutar `pnpm db:init`.

1. Inicia Apache y MySQL en XAMPP.
2. Abre `http://localhost/phpmyadmin`.
3. Selecciona la pestaña **Importar**.
4. Importa primero:

```text
database/schema.sql
```

5. Después importa:

```text
database/seed.sql
```

6. Comprueba que exista la base:

```text
clinica_maro
```

Si utilizas la importación manual, también debes crear el usuario
`inventario_app` desde phpMyAdmin o utilizar temporalmente `root` en `.env`.

Para utilizar `root` temporalmente:

```env
DB_USER=root
DB_PASSWORD=
```

No se recomienda utilizar `root` en producción.

---

## 7. Ejecutar el proyecto en desarrollo

### Dentro de Figma Make

El servidor de Vite ya es iniciado automáticamente. No ejecutes otro servidor
de desarrollo. Después de configurar MariaDB y ejecutar `pnpm db:init`, recarga
la vista previa.

La API está integrada en el servidor de Vite bajo:

```text
/api
```

### Fuera de Figma Make

Ejecuta:

```bash
pnpm dev
```

Abre en el navegador la dirección mostrada por Vite.

---

## 8. Ejecutar como aplicación de producción

Primero genera el frontend:

```bash
pnpm build
```

Después inicia el servidor Node.js:

```bash
pnpm start
```

Por defecto estará disponible en:

```text
http://localhost:3000
```

El servidor entrega el frontend y la API desde el mismo origen.

---

## 9. Comandos disponibles

| Comando | Función |
| --- | --- |
| `pnpm install` | Instala las dependencias |
| `pnpm dev` | Inicia Vite fuera de Figma Make |
| `pnpm db:init` | Crea y carga la base de datos |
| `pnpm build` | Genera la aplicación de producción |
| `pnpm start` | Inicia el servidor Node.js de producción |
| `pnpm preview` | Previsualiza solamente el frontend compilado |
| `pnpm format` | Formatea los archivos del proyecto |

`pnpm preview` no inicia la API de Node.js. Para probar la aplicación completa
de producción utiliza `pnpm start`.

---

## 10. Pruebas y verificaciones

### Comprobar que el frontend compila

```bash
pnpm build
```

El comando debe terminar con un mensaje similar a:

```text
✓ built
```

### Comprobar la sintaxis del servidor

```bash
node --check server/api.js
node --check server/db.js
node --check server/index.js
node --check server/init-db.js
```

Si no se imprime ningún error, la sintaxis es válida.

### Comprobar la conexión con MariaDB

Con el servidor en funcionamiento, abre:

```text
http://localhost:3000/api/health
```

También puedes utilizar `curl`:

```bash
curl http://localhost:3000/api/health
```

La respuesta esperada es:

```json
{
  "ok": true,
  "database": "MariaDB/MySQL"
}
```

### Probar el inicio de sesión mediante la API

#### Linux, macOS o Git Bash

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamaro.cl","password":"Maro2025"}'
```

#### Windows PowerShell

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@clinicamaro.cl","password":"Maro2025"}'
```

La respuesta debe incluir un `token` y la información del usuario.

### Prueba funcional recomendada

1. Inicia sesión como Administrador.
2. Registra un producto.
3. Registra un lote para el producto.
4. Registra una entrada de inventario.
5. Comprueba que el stock aumentó.
6. Registra una salida menor al stock disponible.
7. Comprueba que el stock disminuyó.
8. Intenta registrar una salida mayor al stock disponible.
9. Comprueba que el sistema rechaza la operación.
10. Revisa el historial de movimientos.
11. Marca una alerta como revisada.
12. Crea una orden de compra.
13. Descarga un reporte CSV.
14. Cierra sesión y comprueba los accesos de cada rol.

---

## 11. Estructura principal

```text
database/
  schema.sql        Estructura, triggers y vistas
  seed.sql          Datos y cuentas iniciales

server/
  api.js            Rutas y permisos de la API
  db.js             Conexión y transacciones
  index.js          Servidor de producción
  init-db.js        Inicialización automática

src/
  App.tsx           Interfaz y conexión con la API
  index.css         Estilos globales

public/
  logo-clinica-maro.png
```

---

## 12. Seguridad

- Las contraseñas se almacenan con bcrypt.
- Las sesiones utilizan tokens aleatorios.
- En la base solamente se guarda el hash del token.
- Las sesiones expiran después de ocho horas.
- La cuenta se bloquea durante 15 minutos después de cinco intentos fallidos.
- Los permisos se validan en la API, no solamente en la interfaz.
- El usuario `inventario_app` no puede eliminar movimientos.
- Los movimientos no pueden modificarse ni eliminarse.
- Las salidas sin stock suficiente son rechazadas por la base de datos.
- Los cambios de inventario se ejecutan dentro de transacciones.

Antes de utilizar el sistema en producción:

1. Cambia todas las contraseñas de prueba.
2. Utiliza una contraseña segura para `inventario_app`.
3. No expongas MariaDB directamente a Internet.
4. Configura HTTPS.
5. Realiza respaldos periódicos.

---

## 13. Solución de problemas

### Error `ECONNREFUSED`

MariaDB no está iniciado o el puerto es incorrecto.

1. Abre XAMPP.
2. Inicia MySQL.
3. Verifica `DB_HOST` y `DB_PORT`.

### Error `Access denied for user`

El usuario o la contraseña de `.env` no coinciden con MariaDB.

Revisa:

```env
DB_USER=inventario_app
DB_PASSWORD=tu_clave
```

Si el usuario no existe, vuelve a ejecutar:

```bash
pnpm db:init
```

### Error `Unknown database 'clinica_maro'`

La base todavía no fue creada:

```bash
pnpm db:init
```

### El login indica que no puede conectarse con MariaDB

Comprueba:

1. MySQL está iniciado en XAMPP.
2. Existe el archivo `.env`.
3. La base `clinica_maro` aparece en phpMyAdmin.
4. El usuario de `.env` tiene permisos.
5. Reinicia el servidor después de modificar `.env`.

### El puerto 3306 está ocupado

Revisa el puerto configurado en XAMPP y actualiza:

```env
DB_PORT=puerto_de_xampp
```

### El puerto 3000 está ocupado

Cambia en `.env`:

```env
PORT=3001
```

---

## Usuarios de prueba

> Estas cuentas se crean al ejecutar `pnpm db:init`. Debes cambiar sus
> contraseñas antes de utilizar el sistema con datos reales.

### Administrador

```text
Correo: admin@clinicamaro.cl
Contraseña: Maro2025
```

Acceso completo a productos, movimientos, lotes, alertas, compras, reportes,
usuarios y configuración.

### Encargado de Bodega

```text
Correo: bodega@clinicamaro.cl
Contraseña: Bodega2025
```

Puede consultar el inventario, registrar movimientos, administrar lotes y
revisar alertas.

### Comprador

```text
Correo: compras@clinicamaro.cl
Contraseña: Compras2025
```

Puede consultar productos, revisar alertas y gestionar órdenes de compra.

### Auditor

```text
Correo: auditor@clinicamaro.cl
Contraseña: Auditor2025
```

Puede consultar productos, lotes, alertas, movimientos y reportes, sin modificar
el inventario.
