import crypto from "node:crypto";
import express from "express";
import bcrypt from "bcryptjs";
import { getPool, withTransaction } from "./db.js";

const access = {
  Administrador: ["*"],
  "Encargado de Bodega": ["inventory.read","movements.create","lots.manage","alerts.read"],
  Comprador: ["inventory.read","orders.manage","alerts.read"],
  Auditor: ["inventory.read","alerts.read","reports.read"],
};

function allowed(role, permission) {
  return access[role]?.includes("*") || access[role]?.includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => allowed(req.user.role, permission) ? next() : res.status(403).json({ error: "No tienes permisos para realizar esta acción." });
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function createApiRouter() {
  const router = express.Router();
  router.use(express.json({ limit: "1mb" }));

  router.get("/health", asyncRoute(async (_req,res) => {
    await getPool().query("SELECT 1");
    res.json({ ok: true, database: "MariaDB/MySQL" });
  }));

  router.post("/auth/login", asyncRoute(async (req,res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const [rows] = await getPool().execute(
      `SELECT u.id,u.name,u.email,u.password_hash,u.failed_attempts,u.locked_until,u.active,r.name role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=?`, [email]
    );
    const user = rows[0];
    if (!user || !user.active) return res.status(401).json({ error: "Credenciales inválidas." });
    if (user.locked_until && new Date(user.locked_until) > new Date()) return res.status(423).json({ error: "Cuenta temporalmente bloqueada." });
    const valid = await bcrypt.compare(String(req.body.password || ""), user.password_hash);
    if (!valid) {
      const attempts = user.failed_attempts + 1;
      await getPool().execute("UPDATE users SET failed_attempts=?,locked_until=IF(? >= 5,DATE_ADD(NOW(),INTERVAL 15 MINUTE),NULL) WHERE id=?", [attempts,attempts,user.id]);
      return res.status(401).json({ error: attempts >= 5 ? "Cuenta bloqueada durante 15 minutos." : "Credenciales inválidas." });
    }
    await getPool().execute("UPDATE users SET failed_attempts=0,locked_until=NULL WHERE id=?", [user.id]);
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await getPool().execute("INSERT INTO sessions (user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 8 HOUR))", [user.id,hash]);
    res.json({ token, user: { id:user.id,name:user.name,email:user.email,role:user.role,initials:user.name.split(" ").map(x=>x[0]).slice(0,2).join("") } });
  }));

  router.use(asyncRoute(async (req,res,next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/,"");
    if (!token) return res.status(401).json({ error: "Sesión requerida." });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const [rows] = await getPool().execute(
      `SELECT u.id,u.name,u.email,r.name role FROM sessions s
       JOIN users u ON u.id=s.user_id JOIN roles r ON r.id=u.role_id
       WHERE s.token_hash=? AND s.expires_at>NOW() AND u.active=TRUE`, [hash]
    );
    if (!rows[0]) return res.status(401).json({ error: "La sesión expiró." });
    req.user = rows[0];
    req.tokenHash = hash;
    next();
  }));

  router.post("/auth/logout", asyncRoute(async (req,res) => {
    await getPool().execute("DELETE FROM sessions WHERE token_hash=?", [req.tokenHash]);
    res.status(204).end();
  }));

  router.get("/dashboard", requirePermission("inventory.read"), asyncRoute(async (_req,res) => {
    const [[products],[units],[low],[expiring],[alerts],[recent],[daily]] = await Promise.all([
      getPool().query("SELECT COUNT(*) total FROM products WHERE active=TRUE"),
      getPool().query("SELECT COALESCE(SUM(quantity),0) total FROM lots WHERE expires_at>=CURRENT_DATE"),
      getPool().query("SELECT COUNT(*) total FROM v_products_below_minimum"),
      getPool().query("SELECT COUNT(*) total FROM v_expiring_lots"),
      getPool().query(
        `SELECT a.id,a.alert_type type,a.message,p.name product,a.created_at createdAt
         FROM alerts a JOIN products p ON p.id=a.product_id
         WHERE a.status='Pendiente' ORDER BY a.created_at DESC LIMIT 3`
      ),
      getPool().query("SELECT * FROM v_movement_history ORDER BY created_at DESC LIMIT 5"),
      getPool().query(
        `SELECT DATE(created_at) day,
         COALESCE(SUM(CASE WHEN movement_type IN ('Entrada','Ajuste positivo') THEN quantity ELSE 0 END),0) entries,
         COALESCE(SUM(CASE WHEN movement_type IN ('Salida','Ajuste negativo','Anulación') THEN quantity ELSE 0 END),0) exits
         FROM inventory_movements WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 6 DAY)
         GROUP BY DATE(created_at) ORDER BY day`
      ),
    ]);
    res.json({
      products:products[0].total,units:units[0].total,low:low[0].total,expiring:expiring[0].total,
      pendingAlerts:alerts.length,alerts,recent,daily,
    });
  }));

  router.get("/products", requirePermission("inventory.read"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query(
      `SELECT p.id,p.code,p.name,c.name category,p.unit,p.minimum_stock minimumStock,
       COALESCE(s.available_stock,0) stock,p.active
       FROM products p JOIN categories c ON c.id=p.category_id
       LEFT JOIN v_current_stock s ON s.id=p.id WHERE p.active=TRUE ORDER BY p.name`
    );
    res.json(rows);
  }));

  router.post("/products", requirePermission("products.manage"), asyncRoute(async (req,res) => {
    const { code,name,categoryId,unit,minimumStock,supplierId } = req.body;
    const [result] = await getPool().execute(
      "INSERT INTO products (category_id,preferred_supplier_id,code,name,unit,minimum_stock) VALUES (?,?,?,?,?,?)",
      [categoryId,supplierId || null,code,name,unit,Number(minimumStock)]
    );
    res.status(201).json({ id:result.insertId });
  }));

  router.get("/catalogs", requirePermission("inventory.read"), asyncRoute(async (_req,res) => {
    const [[categories],[suppliers],[products],[lots]] = await Promise.all([
      getPool().query("SELECT id,name FROM categories WHERE active=TRUE ORDER BY name"),
      getPool().query("SELECT id,business_name name FROM suppliers WHERE active=TRUE ORDER BY business_name"),
      getPool().query("SELECT id,name FROM products WHERE active=TRUE ORDER BY name"),
      getPool().query("SELECT id,product_id productId,lot_number lotNumber,quantity FROM lots WHERE quantity>=0 AND expires_at>=CURRENT_DATE ORDER BY expires_at"),
    ]);
    res.json({ categories,suppliers,products,lots });
  }));

  router.get("/movements", (req,res,next) => allowed(req.user.role,"reports.read") || allowed(req.user.role,"movements.create") ? next() : res.status(403).json({ error:"No tienes permisos para consultar movimientos." }), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query("SELECT * FROM v_movement_history ORDER BY created_at DESC LIMIT 200");
    res.json(rows);
  }));

  router.post("/movements", requirePermission("movements.create"), asyncRoute(async (req,res) => {
    const { productId,lotId,type,quantity,reason } = req.body;
    const movementType = type === "Ajuste" ? (Number(quantity) >= 0 ? "Ajuste positivo" : "Ajuste negativo") : type;
    const [result] = await withTransaction((connection) => connection.execute(
      "INSERT INTO inventory_movements (product_id,lot_id,user_id,movement_type,quantity,reason) VALUES (?,?,?,?,?,?)",
      [productId,lotId,req.user.id,movementType,Math.abs(Number(quantity)),reason || null]
    ));
    res.status(201).json({ id:result.insertId });
  }));

  router.get("/lots", requirePermission("inventory.read"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query(
      `SELECT l.id,l.lot_number lot,p.name product,l.quantity stock,l.expires_at expires,
       DATEDIFF(l.expires_at,CURRENT_DATE) days FROM lots l JOIN products p ON p.id=l.product_id ORDER BY l.expires_at`
    );
    res.json(rows);
  }));

  router.post("/lots", requirePermission("lots.manage"), asyncRoute(async (req,res) => {
    const { productId,lotNumber,receivedAt,expiresAt } = req.body;
    const [result] = await getPool().execute("INSERT INTO lots (product_id,lot_number,received_at,expires_at) VALUES (?,?,?,?)",[productId,lotNumber,receivedAt,expiresAt]);
    res.status(201).json({ id:result.insertId });
  }));

  router.get("/alerts", requirePermission("alerts.read"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query(
      `SELECT a.id,a.alert_type type,a.message,a.status,a.created_at createdAt,p.name product,l.lot_number lot
       FROM alerts a JOIN products p ON p.id=a.product_id LEFT JOIN lots l ON l.id=a.lot_id ORDER BY a.status,a.created_at DESC`
    );
    res.json(rows);
  }));

  router.patch("/alerts/:id/review", requirePermission("alerts.read"), asyncRoute(async (req,res) => {
    await getPool().execute("UPDATE alerts SET status='Revisada',reviewed_by=?,reviewed_at=NOW() WHERE id=?",[req.user.id,req.params.id]);
    res.status(204).end();
  }));

  router.get("/orders", requirePermission("orders.manage"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query(
      `SELECT o.id,o.order_number orderNumber,s.business_name supplier,o.status,o.issued_at issuedAt,
       COUNT(i.id) items,COALESCE(SUM(i.quantity*i.unit_price),0) total
       FROM purchase_orders o JOIN suppliers s ON s.id=o.supplier_id
       LEFT JOIN purchase_order_items i ON i.purchase_order_id=o.id GROUP BY o.id ORDER BY o.issued_at DESC`
    );
    res.json(rows);
  }));

  router.post("/orders", requirePermission("orders.manage"), asyncRoute(async (req,res) => {
    const { supplierId,items,notes } = req.body;
    const id = await withTransaction(async (connection) => {
      const number = `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [order] = await connection.execute("INSERT INTO purchase_orders (order_number,supplier_id,buyer_id,issued_at,notes) VALUES (?,?,?,CURRENT_DATE,?)",[number,supplierId,req.user.id,notes || null]);
      for (const item of items || []) await connection.execute("INSERT INTO purchase_order_items (purchase_order_id,product_id,quantity,unit_price) VALUES (?,?,?,?)",[order.insertId,item.productId,item.quantity,item.unitPrice]);
      return order.insertId;
    });
    res.status(201).json({ id });
  }));

  router.get("/reports/:type", requirePermission("reports.read"), asyncRoute(async (req,res) => {
    const reports = {
      stock: "SELECT * FROM v_current_stock ORDER BY name",
      minimum: "SELECT * FROM v_products_below_minimum ORDER BY name",
      expiring: "SELECT * FROM v_expiring_lots ORDER BY expires_at",
      movements: "SELECT * FROM v_movement_history ORDER BY created_at DESC",
      orders: `SELECT o.order_number,s.business_name supplier,o.status,o.issued_at,
               COALESCE(SUM(i.quantity*i.unit_price),0) total FROM purchase_orders o
               JOIN suppliers s ON s.id=o.supplier_id LEFT JOIN purchase_order_items i ON i.purchase_order_id=o.id
               GROUP BY o.id ORDER BY o.issued_at DESC`,
      valuation: `SELECT p.code,p.name,SUM(l.quantity) stock,
                  COALESCE(AVG(i.unit_price),0) average_price,SUM(l.quantity)*COALESCE(AVG(i.unit_price),0) value
                  FROM products p LEFT JOIN lots l ON l.product_id=p.id
                  LEFT JOIN purchase_order_items i ON i.product_id=p.id GROUP BY p.id ORDER BY p.name`,
    };
    const query = reports[req.params.type];
    if (!query) return res.status(404).json({ error:"Reporte desconocido." });
    const [rows] = await getPool().query(query);
    res.json(rows);
  }));

  router.get("/users", requirePermission("users.manage"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query("SELECT u.id,u.name,u.email,r.name role,u.active FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.name");
    res.json(rows);
  }));

  router.post("/users", requirePermission("users.manage"), asyncRoute(async (req,res) => {
    const { name,email,password,roleId } = req.body;
    const hash = await bcrypt.hash(password,10);
    const [result] = await getPool().execute("INSERT INTO users (role_id,name,email,password_hash) VALUES (?,?,?,?)",[roleId,name,email.toLowerCase(),hash]);
    res.status(201).json({ id:result.insertId });
  }));

  router.get("/settings", requirePermission("settings.manage"), asyncRoute(async (_req,res) => {
    const [rows] = await getPool().query("SELECT setting_key `key`,setting_value value FROM settings");
    res.json(Object.fromEntries(rows.map(row => [row.key,row.value])));
  }));

  router.put("/settings", requirePermission("settings.manage"), asyncRoute(async (req,res) => {
    for (const [key,value] of Object.entries(req.body)) await getPool().execute("UPDATE settings SET setting_value=? WHERE setting_key=?",[String(value),key]);
    res.status(204).end();
  }));

  router.use((error,_req,res,_next) => {
    const databaseUnavailable = ["ECONNREFUSED","ENOTFOUND","ETIMEDOUT","PROTOCOL_CONNECTION_LOST"].includes(error.code);
    if (!databaseUnavailable) console.error(error);
    const status = error.code === "ER_DUP_ENTRY" ? 409 : databaseUnavailable ? 503 : 400;
    res.status(status).json({ error: status === 503 ? "No se pudo conectar con MariaDB." : error.sqlMessage || error.message || "Error interno." });
  });
  return router;
}
