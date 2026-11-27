import "dotenv/config";
import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "inventario_app",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "clinica_maro",
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function withTransaction(work) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
