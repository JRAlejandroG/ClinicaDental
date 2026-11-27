import "dotenv/config";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

async function executeFile(connection,path) {
  const source = await fs.readFile(path,"utf8");
  let delimiter = ";";
  let buffer = "";
  for (const line of source.split(/\r?\n/)) {
    const directive = line.match(/^DELIMITER\s+(.+)$/i);
    if (directive) {
      delimiter = directive[1];
      continue;
    }
    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trim().slice(0,-delimiter.length).trim();
      if (statement) await connection.query(statement);
      buffer = "";
    }
  }
  if (buffer.trim()) await connection.query(buffer);
}

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_ROOT_USER || "root",
    password: process.env.DB_ROOT_PASSWORD || "",
    multipleStatements: false,
  });
  await executeFile(connection,new URL("../database/schema.sql",import.meta.url));
  await executeFile(connection,new URL("../database/seed.sql",import.meta.url));
  const appUser = process.env.DB_USER || "inventario_app";
  const appPassword = process.env.DB_PASSWORD || "cambia_esta_clave";
  if (!/^[a-zA-Z0-9_]+$/.test(appUser)) throw new Error("DB_USER contiene caracteres no permitidos.");
  await connection.query(`CREATE USER IF NOT EXISTS ${connection.escape(appUser)}@'%' IDENTIFIED BY ${connection.escape(appPassword)}`);
  await connection.query(`GRANT SELECT,INSERT,UPDATE,EXECUTE ON clinica_maro.* TO ${connection.escape(appUser)}@'%'`);
  await connection.query(`GRANT DELETE ON clinica_maro.sessions TO ${connection.escape(appUser)}@'%'`);
  await connection.query("FLUSH PRIVILEGES");
  await connection.end();
  console.log("Base de datos clinica_maro creada y cargada correctamente.");
}

init().catch((error) => {
  console.error("No fue posible inicializar MariaDB:",error.message);
  process.exitCode = 1;
});
