import { useEffect, useMemo, useState } from "react";

let authToken = "";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (authToken.startsWith("demo:")) return demoApi(path, options) as T;

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...options.headers },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error || "No fue posible completar la operación.", response.status);
  return body as T;
}

type IconName =
  | "grid"
  | "box"
  | "swap"
  | "layers"
  | "bell"
  | "cart"
  | "chart"
  | "users"
  | "settings"
  | "search"
  | "plus"
  | "chevron"
  | "arrowUp"
  | "arrowDown"
  | "alert"
  | "check"
  | "clock"
  | "more"
  | "close"
  | "menu"
  | "tooth"
  | "lock"
  | "logout";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>,
    swap: <><path d="M7 7h11l-3-3"/><path d="m18 7-3 3"/><path d="M17 17H6l3 3"/><path d="m6 17 3-3"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    cart: <><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 10.4A2 2 0 0 0 9.35 16H18a2 2 0 0 0 1.9-1.37L22 8H6"/></>,
    chart: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3h4v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.32 9c.12.37.45.7.83.85H21v4h-.09A1.65 1.65 0 0 0 19.4 15Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrowUp: <><path d="m18 15-6-6-6 6"/><path d="M12 9v12"/></>,
    arrowDown: <><path d="m6 9 6 6 6-6"/><path d="M12 3v12"/></>,
    alert: <><path d="M10.3 3.6 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    close: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    menu: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>,
    tooth: <path d="M12 3c-2.3 0-3.1-1-5.1-1C3.7 2 2 4.5 2.3 8.1c.2 2.2 1.3 3.7 2.1 5.5.9 2 .8 7.4 3.4 8.2 2.2.7 2.1-5.5 4.2-5.5s2 6.2 4.2 5.5c2.6-.8 2.5-6.2 3.4-8.2.8-1.8 1.9-3.3 2.1-5.5C22 4.5 20.3 2 17.1 2c-2 0-2.8 1-5.1 1Z"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const nav = [
  { label: "Resumen", icon: "grid" as IconName },
  { label: "Productos", icon: "box" as IconName },
  { label: "Movimientos", icon: "swap" as IconName },
  { label: "Lotes y vencimientos", icon: "layers" as IconName },
  { label: "Alertas", icon: "bell" as IconName, count: 3 },
  { label: "Órdenes de compra", icon: "cart" as IconName },
  { label: "Reportes", icon: "chart" as IconName },
  { label: "Usuarios", icon: "users" as IconName },
  { label: "Configuración", icon: "settings" as IconName },
];

type Role = "Administrador" | "Encargado de Bodega" | "Comprador" | "Auditor";
type Account = { id?: number; name: string; email: string; password?: string; role: Role; initials: string };

const demoAccounts: Account[] = [
  { name: "Valentina Marín", email: "admin@clinicamaro.cl", password: "Maro2025", role: "Administrador", initials: "VM" },
  { name: "Carolina Soto", email: "bodega@clinicamaro.cl", password: "Bodega2025", role: "Encargado de Bodega", initials: "CS" },
  { name: "Paula Reyes", email: "compras@clinicamaro.cl", password: "Compras2025", role: "Comprador", initials: "PR" },
  { name: "Matías Rojas", email: "auditor@clinicamaro.cl", password: "Auditor2025", role: "Auditor", initials: "MR" },
];

const roleAccess: Record<Role, string[]> = {
  Administrador: nav.map((item) => item.label),
  "Encargado de Bodega": ["Resumen", "Productos", "Movimientos", "Lotes y vencimientos", "Alertas"],
  Comprador: ["Resumen", "Productos", "Alertas", "Órdenes de compra"],
  Auditor: ["Resumen", "Productos", "Movimientos", "Lotes y vencimientos", "Alertas", "Reportes"],
};

const initialProducts = [
  { code: "INS-001", name: "Guantes de nitrilo", category: "Protección", stock: 320, min: 100, unit: "unidades", status: "ok" },
  { code: "INS-002", name: "Mascarilla quirúrgica", category: "Protección", stock: 25, min: 15, unit: "unidades", status: "ok" },
  { code: "INS-003", name: "Suero fisiológico 0,9%", category: "Soluciones", stock: 25, min: 40, unit: "frascos", status: "low" },
  { code: "INS-004", name: "Gasa estéril 10×10", category: "Curación", stock: 80, min: 50, unit: "paquetes", status: "ok" },
  { code: "INS-005", name: "Jeringa desechable 5 ml", category: "Inyección", stock: 495, min: 150, unit: "unidades", status: "ok" },
  { code: "ODO-006", name: "Anestesia dental", category: "Odontología", stock: 18, min: 30, unit: "cárpules", status: "low" },
];

const movements = [
  { id: "#MOV-1082", product: "Gasa estéril 10×10", type: "Salida", qty: 40, date: "Hoy, 10:42", user: "Carolina Soto" },
  { id: "#MOV-1081", product: "Jeringa desechable 5 ml", type: "Ajuste", qty: 5, date: "Hoy, 09:18", user: "Luis Herrera" },
  { id: "#MOV-1080", product: "Guantes de nitrilo", type: "Entrada", qty: 120, date: "Ayer, 16:05", user: "Carolina Soto" },
  { id: "#MOV-1079", product: "Mascarilla quirúrgica", type: "Anulación", qty: 12, date: "Ayer, 14:30", user: "Admin. Maró" },
  { id: "#MOV-1078", product: "Suero fisiológico 0,9%", type: "Salida", qty: 15, date: "12 jun, 11:20", user: "Luis Herrera" },
];

const lots = [
  { lot: "GN-2026-03", product: "Guantes de nitrilo", stock: 30, expires: "02 jul 2025", days: 20, state: "Próximo a vencer" },
  { lot: "AN-2025-08", product: "Anestesia dental", stock: 18, expires: "18 jul 2025", days: 36, state: "Vigente" },
  { lot: "SF-2026-01", product: "Suero fisiológico 0,9%", stock: 25, expires: "15 ene 2026", days: 217, state: "Vigente" },
  { lot: "GE-2026-04", product: "Gasa estéril 10×10", stock: 80, expires: "22 abr 2026", days: 314, state: "Vigente" },
];

const orders = [
  { id: "OC-2025-018", provider: "Dental Sur SpA", items: 3, total: "$284.900", date: "12 jun 2025", state: "Enviada" },
  { id: "OC-2025-017", provider: "Insumos Médicos Araucanía", items: 2, total: "$156.400", date: "08 jun 2025", state: "Recibida" },
  { id: "OC-2025-016", provider: "Dental Sur SpA", items: 5, total: "$412.750", date: "30 may 2025", state: "Borrador" },
];

const demoCategories = [
  { id: 1, name: "Protección" },
  { id: 2, name: "Soluciones" },
  { id: 3, name: "Curación" },
  { id: 4, name: "Inyección" },
  { id: 5, name: "Odontología" },
];
const demoSuppliers = [
  { id: 1, name: "Dental Sur SpA" },
  { id: 2, name: "Insumos Médicos Araucanía" },
];
const demoProducts = initialProducts.map((product, index) => ({
  id: index + 1,
  ...product,
  minimumStock: product.min,
  active: true,
}));
const demoLots = lots.map((lot, index) => ({
  id: index + 1,
  productId: [1, 6, 3, 4][index],
  lotNumber: lot.lot,
  lot: lot.lot,
  product: lot.product,
  quantity: lot.stock,
  stock: lot.stock,
  expires: new Date(Date.now() + lot.days * 86400000).toISOString(),
  days: lot.days,
}));
const demoMovements = movements.map((movement, index) => ({
  id: 1082 - index,
  product_name: movement.product,
  movement_type: movement.type,
  quantity: movement.qty,
  created_at: new Date(Date.now() - index * 86400000).toISOString(),
  user_name: movement.user,
}));
const demoAlerts = [
  { id: 1, type: "Stock mínimo", product: "Suero fisiológico 0,9%", message: "25 unidades disponibles, por debajo del mínimo definido de 40.", status: "Pendiente", createdAt: new Date().toISOString() },
  { id: 2, type: "Vencimiento", product: "Guantes de nitrilo", message: "El lote GN-2026-03 vence dentro de 20 días.", status: "Pendiente", createdAt: new Date().toISOString() },
  { id: 3, type: "Stock mínimo", product: "Anestesia dental", message: "18 cárpules disponibles, por debajo del mínimo definido de 30.", status: "Pendiente", createdAt: new Date().toISOString() },
];
const demoUsers = demoAccounts.map((account, index) => ({ id: index + 1, ...account, active: true }));
const demoSettings: Record<string, string> = {
  expiration_warning_days: "30",
  minimum_stock_alerts: "true",
  daily_summary: "true",
};

function demoApi(path: string, options: RequestInit) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(String(options.body)) : {};

  if (path === "/dashboard") {
    return {
      products: demoProducts.length,
      units: demoProducts.reduce((total, product) => total + product.stock, 0),
      low: demoProducts.filter((product) => product.stock < product.minimumStock).length,
      expiring: demoLots.filter((lot) => lot.days <= 30).length,
      pendingAlerts: demoAlerts.filter((alert)=>alert.status==="Pendiente").length,
      alerts: demoAlerts.filter((alert)=>alert.status==="Pendiente").slice(0,3).map((alert)=>({...alert,createdAt:alert.createdAt})),
      recent: demoMovements.slice(0,5),
      daily: demoMovements.map((movement)=>({day:movement.created_at,entries:movement.movement_type==="Entrada"?movement.quantity:0,exits:movement.movement_type==="Salida"?movement.quantity:0})),
    };
  }
  if (path === "/products" && method === "GET") return demoProducts;
  if (path === "/products" && method === "POST") {
    demoProducts.push({ id: demoProducts.length + 1, ...body, min: body.minimumStock, stock: 0, status: "low", active: true });
    return { id: demoProducts.length };
  }
  if (path === "/catalogs") {
    return { categories: demoCategories, suppliers: demoSuppliers, products: demoProducts, lots: demoLots };
  }
  if (path === "/movements" && method === "GET") return demoMovements;
  if (path === "/movements" && method === "POST") {
    const product = demoProducts.find((item) => item.id === body.productId);
    demoMovements.unshift({ id: 1083 + demoMovements.length, product_name: product?.name || "Producto", movement_type: body.type, quantity: body.quantity, created_at: new Date().toISOString(), user_name: "Usuario demo" });
    return { id: demoMovements[0].id };
  }
  if (path === "/lots" && method === "GET") return demoLots;
  if (path === "/lots" && method === "POST") {
    const product = demoProducts.find((item) => item.id === body.productId);
    const days = Math.ceil((new Date(body.expiresAt).getTime() - Date.now()) / 86400000);
    demoLots.push({ id: demoLots.length + 1, productId: body.productId, lotNumber: body.lotNumber, lot: body.lotNumber, product: product?.name || "Producto", quantity: 0, stock: 0, expires: body.expiresAt, days });
    return { id: demoLots.length };
  }
  if (path === "/alerts" && method === "GET") return demoAlerts;
  if (path.startsWith("/alerts/") && method === "PATCH") {
    const alert = demoAlerts.find((item) => item.id === Number(path.split("/")[2]));
    if (alert) alert.status = "Revisada";
    return null;
  }
  if (path === "/orders" && method === "GET") {
    return orders.map((order, index) => ({ id: index + 1, orderNumber: order.id, supplier: order.provider, items: order.items, total: Number(order.total.replace(/\D/g, "")), issuedAt: new Date().toISOString(), status: order.state }));
  }
  if (path === "/orders" && method === "POST") return { id: Date.now() };
  if (path === "/users" && method === "GET") return demoUsers;
  if (path === "/users" && method === "POST") {
    const roles: Role[] = ["Administrador", "Encargado de Bodega", "Comprador", "Auditor"];
    demoUsers.push({ id: demoUsers.length + 1, name: body.name, email: body.email, password: body.password, role: roles[body.roleId - 1], initials: body.name.split(" ").map((part: string) => part[0]).slice(0, 2).join(""), active: true });
    return { id: demoUsers.length };
  }
  if (path === "/settings" && method === "GET") return demoSettings;
  if (path === "/settings" && method === "PUT") {
    Object.assign(demoSettings, Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String(value)])));
    return null;
  }
  if (path.startsWith("/reports/")) {
    const type = path.split("/").pop();
    if (type === "movements") return demoMovements;
    if (type === "orders") return orders;
    if (type === "expiring") return demoLots.filter((lot) => lot.days <= Number(demoSettings.expiration_warning_days));
    if (type === "minimum") return demoProducts.filter((product) => product.stock < product.minimumStock);
    return demoProducts;
  }
  if (path === "/auth/logout") return null;
  throw new ApiError("Esta operación no está disponible en el modo de demostración.", 404);
}

function Button({ children, variant = "primary", onClick, icon, disabled = false, type = "button" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; onClick?: () => void; icon?: IconName; disabled?: boolean; type?: "button" | "submit" }) {
  return <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={17}/>}<span>{children}</span></button>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Header({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function DataTable({ children, headers }: { children: React.ReactNode; headers: string[] }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function EmptyRow({ columns, message = "No se encontraron resultados para los filtros seleccionados." }: { columns: number; message?: string }) {
  return <tr><td className="table-empty" colSpan={columns}><Icon name="search" size={22}/><span>{message}</span></td></tr>;
}

function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return <label className="filter-select"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{children}</select><Icon name="chevron" size={14}/></label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Clínica Dental Maró</span><h2>{title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close"/></button></div>{children}</div></div>;
}

function Login({ onLogin }: { onLogin: (account: Account, token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{token:string;user:Account}>("/auth/login",{ method:"POST",body:JSON.stringify({email,password}) });
      onLogin(result.user,result.token);
    } catch (caught) {
      const demoAccount = demoAccounts.find((account) => account.email === email.trim().toLowerCase() && account.password === password);
      const apiUnavailable = caught instanceof TypeError || (caught instanceof ApiError && caught.status === 503);
      if (demoAccount && apiUnavailable) {
        onLogin(demoAccount, `demo:${demoAccount.email}`);
        return;
      }
      setError(caught instanceof Error ? caught.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (account: Account) => {
    setEmail(account.email);
    setPassword(account.password || "");
    setError("");
  };

  return <div className="login-page">
    <div className="login-accent"><div className="login-accent-content"><span className="login-symbol"><Icon name="tooth" size={38}/></span><h1>Inventario clínico,<br/>siempre bajo control.</h1><p>Gestiona insumos, vencimientos y compras de Clínica Dental Maró desde un solo lugar.</p><div className="login-points"><span><Icon name="check"/>Stock actualizado en tiempo real</span><span><Icon name="check"/>Alertas automáticas y trazabilidad</span><span><Icon name="check"/>Acceso seguro según cada rol</span></div></div><small>Clínica Dental Maró · Temuco, Chile</small></div>
    <div className="login-main">
      <div className="login-form-wrap">
        <img className="login-logo" src="/logo-clinica-maro.png" alt="Clínica Dental Maró"/>
        <div className="login-title"><span className="eyebrow">Sistema de gestión</span><h2>Bienvenido</h2><p>Ingresa tus credenciales para acceder al sistema.</p></div>
        <form className="login-form" onSubmit={submit}>
          <label className="field"><span>Correo electrónico</span><div className="login-input"><Icon name="users" size={18}/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="usuario@clinicamaro.cl" required/></div></label>
          <label className="field"><span>Contraseña</span><div className="login-input"><Icon name="lock" size={18}/><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required/></div></label>
          {error&&<div className="login-error"><Icon name="alert" size={16}/>{error}</div>}
          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>{loading?"Verificando...":"Ingresar al sistema"} {!loading&&<Icon name="chevron" size={17}/>}</button>
        </form>
      </div>
      <div className="demo-section">
        <div className="demo-heading"><div><strong>Cuentas de demostración</strong><p>Selecciona una cuenta para completar sus credenciales.</p></div><Badge tone="info">4 roles</Badge></div>
        <div className="demo-accounts">{demoAccounts.map((account)=><button type="button" className={`demo-account ${email===account.email?"selected":""}`} onClick={()=>selectAccount(account)} key={account.role}><span className="mini-avatar">{account.initials}</span><span><strong>{account.role}</strong><small>{account.email}</small></span><Icon name="chevron" size={16}/></button>)}</div>
        <p className="demo-note"><Icon name="lock" size={13}/>Las contraseñas se completan automáticamente al elegir una cuenta.</p>
      </div>
    </div>
  </div>;
}

function Dashboard({ setPage, openMovement, account }: { setPage: (p: string) => void; openMovement: () => void; account: Account }) {
  const [metrics,setMetrics]=useState<any>({products:0,units:0,low:0,expiring:0,pendingAlerts:0,alerts:[],recent:[],daily:[]});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api<any>("/dashboard").then(data=>setMetrics((current:any)=>({...current,...data}))).finally(()=>setLoading(false));},[]);
  const chart = useMemo(()=>{
    const rows = Array.from({length:7},(_,index)=>{
      const date=new Date(); date.setDate(date.getDate()-(6-index));
      const key=date.toISOString().slice(0,10);
      const item=(metrics.daily||[]).find((row:any)=>String(row.day).slice(0,10)===key);
      return {d:date.toLocaleDateString("es-CL",{weekday:"short"}).replace(".",""),a:Number(item?.entries||0),b:Number(item?.exits||0)};
    });
    const max=Math.max(1,...rows.flatMap(row=>[row.a,row.b]));
    return rows.map(row=>({...row,ah:Math.max(row.a?8:0,(row.a/max)*100),bh:Math.max(row.b?8:0,(row.b/max)*100)}));
  },[metrics.daily]);
  return <>
    <Header title={`Buenos días, ${account.name.split(" ")[0]}`} description={`Vista de ${account.role.toLowerCase()} · Estado del inventario de Clínica Dental Maró.`} action={["Administrador","Encargado de Bodega"].includes(account.role)&&<Button icon="plus" onClick={openMovement}>Registrar movimiento</Button>}/>
    <div className="stats-grid">
      {[
        { label: "Productos activos", value: String(metrics.products), note: "Catálogo vigente", icon: "box", tone: "green" },
        { label: "Unidades disponibles", value: Number(metrics.units).toLocaleString("es-CL"), note: "Stock no vencido", icon: "layers", tone: "blue" },
        { label: "Bajo stock mínimo", value: String(metrics.low), note: "Requieren reposición", icon: "alert", tone: "red" },
        { label: "Próximos a vencer", value: String(metrics.expiring), note: "En el período configurado", icon: "clock", tone: "amber" },
      ].map((s) => <button className="stat-card" key={s.label} onClick={()=>setPage(s.label==="Productos activos"||s.label==="Unidades disponibles"?"Productos":s.label==="Bajo stock mínimo"?"Productos":"Lotes y vencimientos")}><div className={`stat-icon ${s.tone}`}><Icon name={s.icon as IconName}/></div><div className="stat-value">{loading?"—":s.value}</div><div className="stat-label">{s.label}</div><div className={`stat-note ${s.tone}`}>{s.note}</div></button>)}
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="panel-head"><div><h2>Movimientos de inventario</h2><p>Entradas y salidas de los últimos 7 días</p></div><Badge>Últimos 7 días</Badge></div>
        <div className="chart-legend"><span><i className="dot green-dot"/>Entradas</span><span><i className="dot blue-dot"/>Salidas</span></div>
        <div className="bar-chart">
          {chart.map(x=><div className="bar-group" key={x.d}><div className="bars"><i className="bar in" title={`${x.a} entradas`} style={{height:`${x.ah}%`}}/><i className="bar out" title={`${x.b} salidas`} style={{height:`${x.bh}%`}}/></div><span>{x.d}</span></div>)}
        </div>
      </section>
      <section className="panel alert-panel">
        <div className="panel-head"><div><h2>Alertas activas</h2><p>Requieren tu atención</p></div><button className="text-link" onClick={() => setPage("Alertas")}>Ver todas <Icon name="chevron" size={15}/></button></div>
        <div className="alert-list">{(metrics.alerts||[]).map((item:any)=><div className="alert-row" key={item.id}><span className={`alert-icon ${item.type==="Stock mínimo"?"danger":"warning"}`}><Icon name={item.type==="Stock mínimo"?"arrowDown":"clock"}/></span><div><strong>{item.type}</strong><p>{item.product}</p><small>{item.message}</small></div><Badge tone={item.type==="Stock mínimo"?"danger":"warning"}>{item.type==="Stock mínimo"?"Crítica":"Atención"}</Badge></div>)}{!loading&&!metrics.alerts?.length&&<div className="compact-empty"><Icon name="check"/><span>Sin alertas pendientes</span></div>}</div>
      </section>
    </div>
    <section className="panel recent-panel">
      <div className="panel-head"><div><h2>Actividad reciente</h2><p>Últimos movimientos registrados</p></div><button className="text-link" onClick={() => setPage("Movimientos")}>Ver historial <Icon name="chevron" size={15}/></button></div>
      <DataTable headers={["Movimiento", "Producto", "Tipo", "Cantidad", "Fecha", "Responsable"]}>
        {(metrics.recent||[]).map((m:any)=><tr key={m.id}><td className="code">#MOV-{m.id}</td><td><strong>{m.product_name}</strong><small>{m.lot_number}</small></td><td><Badge tone={m.movement_type==="Entrada"?"success":m.movement_type==="Salida"?"info":"neutral"}>{m.movement_type}</Badge></td><td className={["Entrada","Ajuste positivo"].includes(m.movement_type)?"positive":"negative"}>{["Entrada","Ajuste positivo"].includes(m.movement_type)?"+":"−"}{m.quantity}</td><td>{new Date(m.created_at).toLocaleString("es-CL")}</td><td>{m.user_name}</td></tr>)}
        {!loading&&!metrics.recent?.length&&<EmptyRow columns={6} message="Todavía no hay movimientos registrados."/>}
      </DataTable>
    </section>
  </>;
}

function Products({ query, setQuery, onAdd, canEdit, version }: { query: string; setQuery: (q: string) => void; onAdd: () => void; canEdit: boolean; version: number }) {
  const [products,setProducts] = useState<any[]>(authToken.startsWith("demo:")?initialProducts:[]);
  const [category,setCategory]=useState("Todas");
  const [stockState,setStockState]=useState("Todos");
  useEffect(()=>{api<any[]>("/products").then(rows=>setProducts(rows.map(p=>({...p,min:p.minimumStock,status:p.stock<p.minimumStock?"low":"ok"})))).catch(()=>{});},[version]);
  const categories=useMemo(()=>Array.from(new Set(products.map(product=>product.category))).sort(),[products]);
  const filtered = products.filter(p => (p.name.toLowerCase().includes(query.toLowerCase()) || p.code.toLowerCase().includes(query.toLowerCase()))&&(category==="Todas"||p.category===category)&&(stockState==="Todos"||(stockState==="Bajo"&&p.status==="low")||(stockState==="Disponible"&&p.status==="ok")));
  return <>
    <Header title="Productos" description={canEdit?"Administra el catálogo de insumos clínicos y sus niveles de stock.":"Consulta el catálogo de insumos clínicos y sus niveles de stock."} action={canEdit&&<Button icon="plus" onClick={onAdd}>Nuevo producto</Button>}/>
    <section className="panel"><div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre o código..."/></label><div className="toolbar-actions"><FilterSelect label="Filtrar por categoría" value={category} onChange={setCategory}><option>Todas</option>{categories.map(item=><option key={item}>{item}</option>)}</FilterSelect><FilterSelect label="Filtrar por estado de stock" value={stockState} onChange={setStockState}><option>Todos</option><option value="Disponible">Disponible</option><option value="Bajo">Bajo stock</option></FilterSelect></div></div>
      <DataTable headers={["Código", "Producto", "Categoría", "Stock actual", "Stock mínimo", "Estado"]}>
        {filtered.map(p=><tr key={p.code}><td className="code">{p.code}</td><td><strong>{p.name}</strong><small>{p.unit}</small></td><td>{p.category}</td><td><strong>{p.stock}</strong></td><td>{p.min}</td><td><Badge tone={p.status==="low"?"danger":"success"}>{p.status==="low"?"Bajo stock":"Disponible"}</Badge></td></tr>)}
        {!filtered.length&&<EmptyRow columns={6}/>}
      </DataTable>
    </section>
  </>;
}

function Movements({ onAdd, canEdit, version }: { onAdd: () => void; canEdit: boolean; version: number }) {
  const [items,setItems] = useState<any[]>(authToken.startsWith("demo:")?movements:[]);
  const [query,setQuery]=useState("");
  const [type,setType]=useState("Todos");
  const [period,setPeriod]=useState("Todos");
  useEffect(()=>{api<any[]>("/movements").then(rows=>setItems(rows.map(m=>({id:`#MOV-${m.id}`,product:m.product_name,type:m.movement_type,qty:m.quantity,date:new Date(m.created_at).toLocaleString("es-CL"),rawDate:m.created_at,user:m.user_name,reason:m.reason,lot:m.lot_number})))).catch(()=>{});},[version]);
  const filtered=items.filter((item:any)=>{
    const matchQuery=[item.id,item.product,item.lot].some(value=>String(value||"").toLowerCase().includes(query.toLowerCase()));
    const matchType=type==="Todos"||(type==="Ajuste"&&String(item.type).startsWith("Ajuste"))||item.type===type;
    const date=new Date(item.rawDate||Date.now()); const now=new Date();
    const matchPeriod=period==="Todos"||(period==="30"&&date>=new Date(now.getTime()-30*86400000))||(period==="7"&&date>=new Date(now.getTime()-7*86400000));
    return matchQuery&&matchType&&matchPeriod;
  });
  const totals={entries:items.filter((item:any)=>["Entrada","Ajuste positivo"].includes(item.type)).reduce((sum:number,item:any)=>sum+Number(item.qty),0),exits:items.filter((item:any)=>["Salida","Ajuste negativo"].includes(item.type)).reduce((sum:number,item:any)=>sum+Number(item.qty),0),adjustments:items.filter((item:any)=>String(item.type).startsWith("Ajuste")||item.type==="Anulación").length};
  return <>
    <Header title="Movimientos" description="Historial íntegro de entradas, salidas, ajustes y anulaciones." action={canEdit&&<Button icon="plus" onClick={onAdd}>Registrar movimiento</Button>}/>
    <div className="mini-stats"><div><Icon name="arrowUp"/><span><strong>{totals.entries.toLocaleString("es-CL")}</strong>Unidades ingresadas</span></div><div><Icon name="arrowDown"/><span><strong>{totals.exits.toLocaleString("es-CL")}</strong>Unidades retiradas</span></div><div><Icon name="swap"/><span><strong>{totals.adjustments}</strong>Ajustes y anulaciones</span></div></div>
    <section className="panel"><div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar ID, producto o lote..."/></label><div className="toolbar-actions"><FilterSelect label="Filtrar por tipo" value={type} onChange={setType}><option>Todos</option><option>Entrada</option><option>Salida</option><option>Ajuste</option><option>Anulación</option></FilterSelect><FilterSelect label="Filtrar por período" value={period} onChange={setPeriod}><option value="Todos">Todo el historial</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option></FilterSelect></div></div>
      <DataTable headers={["ID", "Producto / lote", "Tipo", "Cantidad", "Fecha", "Responsable", "Motivo"]}>{filtered.map((m:any)=><tr key={m.id}><td className="code">{m.id}</td><td><strong>{m.product}</strong>{m.lot&&<small>Lote {m.lot}</small>}</td><td><Badge tone={m.type==="Entrada"?"success":m.type==="Salida"?"info":m.type==="Anulación"?"warning":"neutral"}>{m.type}</Badge></td><td className={["Entrada","Ajuste positivo"].includes(m.type)?"positive":"negative"}>{["Entrada","Ajuste positivo"].includes(m.type)?"+":"−"}{m.qty}</td><td>{m.date}</td><td>{m.user}</td><td className="reason-cell">{m.reason||"Sin observación"}</td></tr>)}{!filtered.length&&<EmptyRow columns={7}/>}</DataTable>
    </section>
  </>;
}

function Lots({ canEdit, onAdd, version }: { canEdit: boolean; onAdd: () => void; version: number }) {
  const [items,setItems] = useState<any[]>(authToken.startsWith("demo:")?lots:[]);
  const [query,setQuery]=useState("");
  const [state,setState]=useState("Todos");
  useEffect(()=>{api<any[]>("/lots").then(rows=>setItems(rows.map(l=>({...l,expires:new Date(l.expires).toLocaleDateString("es-CL"),state:l.days<0?"Vencido":l.days<=30?"Próximo a vencer":"Vigente"})))).catch(()=>{});},[version]);
  const filtered=items.filter((item:any)=>(item.lot.toLowerCase().includes(query.toLowerCase())||item.product.toLowerCase().includes(query.toLowerCase()))&&(state==="Todos"||item.state===state));
  const attention=items.filter((item:any)=>item.state!=="Vigente").length;
  return <>
    <Header title="Lotes y vencimientos" description="Controla la trazabilidad y vigencia de cada lote almacenado." action={canEdit&&<Button icon="plus" onClick={onAdd}>Registrar lote</Button>}/>
    <div className="notice warning-notice"><span><Icon name="clock"/></span><div><strong>{attention} {attention===1?"lote requiere":"lotes requieren"} atención</strong><p>Incluye lotes vencidos y próximos a vencer dentro de 30 días.</p></div></div>
    <section className="panel"><div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar lote o producto..."/></label><FilterSelect label="Filtrar por estado" value={state} onChange={setState}><option>Todos</option><option>Vigente</option><option>Próximo a vencer</option><option>Vencido</option></FilterSelect></div>
      <DataTable headers={["Nº de lote", "Producto", "Stock disponible", "Fecha de vencimiento", "Días restantes", "Estado"]}>{filtered.map((l:any)=><tr className={l.state==="Vencido"?"row-danger":l.state==="Próximo a vencer"?"row-warning":""} key={l.lot}><td className="code">{l.lot}</td><td><strong>{l.product}</strong></td><td>{l.stock}</td><td>{l.expires}</td><td className={l.days<0?"negative":l.days<=30?"warning-text":""}>{l.days<0?`Hace ${Math.abs(l.days)} días`:`${l.days} días`}</td><td><Badge tone={l.state==="Vigente"?"success":l.state==="Vencido"?"danger":"warning"}>{l.state}</Badge></td></tr>)}{!filtered.length&&<EmptyRow columns={6}/>}</DataTable>
    </section>
  </>;
}

function Alerts({ onChange }: { onChange: (count: number) => void }) {
  const [items,setItems] = useState<any[]>([]);
  const [status,setStatus]=useState("Pendiente");
  const [kind,setKind]=useState("Todas");
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const load=()=>api<any[]>("/alerts").then(rows=>{setItems(rows);onChange(rows.filter(item=>item.status==="Pendiente").length)}).catch(error=>setMessage(error instanceof Error?error.message:"No fue posible cargar las alertas."));
  useEffect(load,[]);
  const review = async (id:string) => {
    setBusy(id); setMessage("");
    try { await api(`/alerts/${id}/review`,{method:"PATCH"}); await load(); setMessage("Alerta marcada como revisada."); }
    catch (error) { setMessage(error instanceof Error?error.message:"No fue posible actualizar la alerta."); }
    finally { setBusy(""); }
  };
  const filtered=items.filter(item=>(status==="Todas"||item.status===status)&&(kind==="Todas"||item.type===kind));
  const pending=items.filter(item=>item.status==="Pendiente").length;
  return <>
    <Header title="Alertas" description="Notificaciones automáticas de stock y vencimientos."/>
    <div className="tabs"><button className={status==="Pendiente"?"active":""} onClick={()=>setStatus("Pendiente")}>Pendientes <span>{pending}</span></button><button className={status==="Revisada"?"active":""} onClick={()=>setStatus("Revisada")}>Revisadas</button><button className={status==="Todas"?"active":""} onClick={()=>setStatus("Todas")}>Todas</button><FilterSelect label="Filtrar por tipo" value={kind} onChange={setKind}><option>Todas</option><option>Stock mínimo</option><option>Vencimiento</option></FilterSelect></div>
    {message&&<div className={`inline-feedback ${message.includes("revisada")?"success":"error"}`}>{message}</div>}
    <div className="alerts-page">{filtered.map(i=>{const tone=i.type==="Stock mínimo"?"danger":"warning";return <div className={`big-alert ${i.status==="Revisada"?"reviewed":""}`} key={i.id}><span className={`alert-icon ${tone}`}><Icon name={tone==="danger"?"arrowDown":"clock"}/></span><div className="big-alert-copy"><div><Badge tone={tone}>{i.type}</Badge><Badge tone={i.status==="Revisada"?"success":"neutral"}>{i.status}</Badge><small>{new Date(i.createdAt).toLocaleString("es-CL")}</small></div><h3>{i.type}: {i.product}</h3><p>{i.message}</p></div>{i.status==="Pendiente"&&<Button variant="secondary" disabled={busy===String(i.id)} onClick={()=>review(String(i.id))} icon="check">{busy===String(i.id)?"Guardando...":"Marcar revisada"}</Button>}</div>})}{!filtered.length&&<div className="empty-state"><span><Icon name="check" size={30}/></span><h2>Sin resultados</h2><p>No hay alertas que coincidan con estos filtros.</p></div>}</div>
  </>;
}

function Orders({ onAdd, version }: { onAdd: () => void; version: number }) {
  const [items,setItems] = useState<any[]>(authToken.startsWith("demo:")?orders:[]);
  const [query,setQuery]=useState("");
  const [state,setState]=useState("Todos");
  useEffect(()=>{api<any[]>("/orders").then(rows=>setItems(rows.map(o=>({id:o.orderNumber,provider:o.supplier,items:o.items,total:Number(o.total).toLocaleString("es-CL",{style:"currency",currency:"CLP"}),date:new Date(o.issuedAt).toLocaleDateString("es-CL"),state:o.status})))).catch(()=>{});},[version]);
  const filtered=items.filter(item=>(item.id.toLowerCase().includes(query.toLowerCase())||item.provider.toLowerCase().includes(query.toLowerCase()))&&(state==="Todos"||item.state===state));
  return <>
    <Header title="Órdenes de compra" description="Planifica y controla la reposición de insumos." action={<Button icon="plus" onClick={onAdd}>Nueva orden</Button>}/>
    <div className="mini-stats"><div><Icon name="clock"/><span><strong>{items.filter(item=>item.state==="Borrador").length}</strong>Órdenes en borrador</span></div><div><Icon name="cart"/><span><strong>{items.filter(item=>item.state==="Enviada").length}</strong>Órdenes enviadas</span></div><div><Icon name="check"/><span><strong>{items.filter(item=>item.state==="Recibida").length}</strong>Órdenes recibidas</span></div></div>
    <section className="panel"><div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar orden o proveedor..."/></label><FilterSelect label="Filtrar por estado" value={state} onChange={setState}><option>Todos</option><option>Borrador</option><option>Enviada</option><option>Recibida</option><option>Anulada</option></FilterSelect></div>
      <DataTable headers={["Orden", "Proveedor", "Productos", "Total", "Fecha de emisión", "Estado"]}>{filtered.map(o=><tr key={o.id}><td className="code">{o.id}</td><td><strong>{o.provider}</strong></td><td>{o.items} productos</td><td><strong>{o.total}</strong></td><td>{o.date}</td><td><Badge tone={o.state==="Recibida"?"success":o.state==="Enviada"?"info":o.state==="Anulada"?"danger":"neutral"}>{o.state}</Badge></td></tr>)}{!filtered.length&&<EmptyRow columns={6}/>}</DataTable>
    </section>
  </>;
}

function Reports() {
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState("");
  const download = async (type:string) => {
    setBusy(type);setMessage("");
    try{
      let rows=await api<Record<string,unknown>[]>(`/reports/${type}`);
      if((from||to)&&["movements","orders"].includes(type)) rows=rows.filter(row=>{const raw=row.created_at||row.issued_at;const date=raw?String(raw).slice(0,10):"";return(!from||date>=from)&&(!to||date<=to)});
      if (!rows.length){setMessage("No existen datos para generar este reporte con los filtros seleccionados.");return}
      const headers=Object.keys(rows[0]);
      const csv=[headers.join(";"),...rows.map(row=>headers.map(key=>`"${String(row[key]??"").replaceAll('"','""')}"`).join(";"))].join("\n");
      const link=document.createElement("a");
      link.href=URL.createObjectURL(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}));
      link.download=`reporte-${type}-${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      setMessage("Reporte CSV generado correctamente.");
    }catch(caught){setMessage(caught instanceof Error?caught.message:"No fue posible generar el reporte.")}
    finally{setBusy("")}
  };
  const reportsList=[["Stock actual","Existencias disponibles por producto y categoría.","box","stock"],["Productos bajo mínimo","Insumos que requieren reposición prioritaria.","alert","minimum"],["Próximos vencimientos","Lotes que vencerán dentro del período configurado.","clock","expiring"],["Historial de movimientos","Auditoría completa de operaciones del inventario.","swap","movements"],["Órdenes de compra","Compras emitidas, estados, proveedores y montos.","cart","orders"],["Valorización de inventario","Valor estimado del stock actualmente disponible.","chart","valuation"]];
  return <>
    <Header title="Reportes" description="Información confiable para apoyar la toma de decisiones." action={<Button icon="arrowDown" onClick={()=>download("stock")}>Exportar stock</Button>}/>
    <section className="report-filters"><div><strong>Período de movimientos y compras</strong><p>Las fechas se aplican a los reportes que contienen historial.</p></div><label className="field"><span>Desde</span><input type="date" value={from} onChange={event=>setFrom(event.target.value)}/></label><label className="field"><span>Hasta</span><input type="date" value={to} onChange={event=>setTo(event.target.value)}/></label></section>
    {message&&<div className={`inline-feedback ${message.includes("correctamente")?"success":"error"}`}>{message}</div>}
    <div className="report-grid">
      {reportsList.map(r=><div className="report-card" key={r[0]}><span><Icon name={r[2] as IconName}/></span><h3>{r[0]}</h3><p>{r[1]}</p><button className="text-link" disabled={busy===r[3]} onClick={()=>download(r[3])}>{busy===r[3]?"Generando...":"Generar reporte"} <Icon name="chevron" size={15}/></button></div>)}
    </div>
  </>;
}

function Users({ onAdd, version }: { onAdd: () => void; version: number }) {
  const fallback=[["Valentina Marín","admin@clinicamaro.cl","Administrador","Activo","VM"],["Carolina Soto","bodega@clinicamaro.cl","Encargado de Bodega","Activo","CS"],["Paula Reyes","compras@clinicamaro.cl","Comprador","Activo","PR"],["Matías Rojas","auditor@clinicamaro.cl","Auditor","Activo","MR"]];
  const [users,setUsers]=useState<string[][]>(authToken.startsWith("demo:")?fallback:[]);
  const [query,setQuery]=useState("");
  const [role,setRole]=useState("Todos");
  useEffect(()=>{api<any[]>("/users").then(rows=>setUsers(rows.map(u=>[u.name,u.email,u.role,u.active?"Activo":"Inactivo",u.name.split(" ").map((x:string)=>x[0]).slice(0,2).join("")]))).catch(()=>{});},[version]);
  const filtered=users.filter(user=>(user[0].toLowerCase().includes(query.toLowerCase())||user[1].toLowerCase().includes(query.toLowerCase()))&&(role==="Todos"||user[2]===role));
  return <>
    <Header title="Usuarios y accesos" description="Gestiona cuentas, roles y permisos del equipo." action={<Button icon="plus" onClick={onAdd}>Nuevo usuario</Button>}/>
    <section className="panel"><div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre o correo..."/></label><FilterSelect label="Filtrar por rol" value={role} onChange={setRole}><option>Todos</option>{Object.keys(roleAccess).map(item=><option key={item}>{item}</option>)}</FilterSelect></div><DataTable headers={["Usuario", "Correo", "Rol", "Estado"]}>{filtered.map(u=><tr key={u[1]}><td><div className="user-cell"><span className="mini-avatar">{u[4]}</span><strong>{u[0]}</strong></div></td><td>{u[1]}</td><td><Badge>{u[2]}</Badge></td><td><Badge tone={u[3]==="Activo"?"success":"danger"}>{u[3]}</Badge></td></tr>)}{!filtered.length&&<EmptyRow columns={4}/>}</DataTable></section>
    <section className="permissions-panel"><h2>Permisos por rol</h2><p>Los permisos se aplican también en la API; ocultar un control no reemplaza la autorización del servidor.</p><div className="permission-grid">{(Object.entries(roleAccess) as [Role,string[]][]).map(([name,pages])=><div key={name}><strong>{name}</strong><span>{pages.join(" · ")}</span></div>)}</div></section>
  </>;
}

function Settings() {
  const [section,setSection]=useState("Alertas e inventario");
  const [days,setDays]=useState("30");
  const [stockAlerts,setStockAlerts]=useState(true);
  const [dailySummary,setDailySummary]=useState(true);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{api<Record<string,string>>("/settings").then(data=>{setDays(data.expiration_warning_days || "30");setStockAlerts(data.minimum_stock_alerts!=="false");setDailySummary(data.daily_summary!=="false")}).catch(()=>{});},[]);
  const save = async () => {
    const parsed=Number(days);
    if(!Number.isInteger(parsed)||parsed<1||parsed>365){setError("La anticipación debe ser un número entre 1 y 365 días.");return;}
    setSaving(true);setError("");
    try{await api("/settings",{method:"PUT",body:JSON.stringify({expiration_warning_days:days,minimum_stock_alerts:stockAlerts,daily_summary:dailySummary})});setSaved(true);window.setTimeout(()=>setSaved(false),2000)}
    catch(caught){setError(caught instanceof Error?caught.message:"No fue posible guardar la configuración.")}
    finally{setSaving(false)}
  };
  const sections=["Alertas e inventario","Información de la clínica","Seguridad","Permisos y roles"];
  return <>
    <Header title="Configuración" description="Ajustes generales, alertas y seguridad del sistema."/>
    <div className="settings-grid"><aside className="settings-nav">{sections.map(item=><button className={section===item?"active":""} onClick={()=>setSection(item)} key={item}>{item}</button>)}</aside>
      {section==="Alertas e inventario"&&<section className="panel settings-panel"><h2>Alertas e inventario</h2><p>Configura cómo se monitorea automáticamente el inventario.</p><hr/>
        <label className="field"><span>Anticipación de vencimientos</span><small>Generar una alerta cuando un lote esté próximo a vencer.</small><div className="input-suffix"><input value={days} onChange={e=>setDays(e.target.value)}/><span>días</span></div></label>
        <div className="switch-row"><div><strong>Alertas de stock mínimo</strong><p>Notificar cuando el stock disponible sea inferior al mínimo.</p></div><button aria-label="Alternar alertas de stock mínimo" className={`switch ${stockAlerts?"on":""}`} onClick={()=>setStockAlerts(!stockAlerts)}><i/></button></div>
        <div className="switch-row"><div><strong>Resumen diario</strong><p>Enviar un resumen de alertas pendientes al administrador.</p></div><button aria-label="Alternar resumen diario" className={`switch ${dailySummary?"on":""}`} onClick={()=>setDailySummary(!dailySummary)}><i/></button></div>
        {error&&<div className="inline-feedback error">{error}</div>}<div className="form-actions"><Button disabled={saving} onClick={save}>{saving?"Guardando...":saved?"Cambios guardados":"Guardar cambios"}</Button></div>
      </section>}
      {section==="Información de la clínica"&&<section className="panel settings-panel"><h2>Información de la clínica</h2><p>Datos institucionales visibles en el sistema.</p><hr/><div className="read-only-grid"><label className="field"><span>Nombre</span><input value="Clínica Dental Maró" readOnly/></label><label className="field"><span>Ciudad</span><input value="Temuco, Chile" readOnly/></label></div><div className="notice info-notice"><Icon name="lock"/><span>Esta información es de solo lectura. Su edición requiere soporte adicional en el backend.</span></div></section>}
      {section==="Seguridad"&&<section className="panel settings-panel"><h2>Seguridad</h2><p>Políticas aplicadas por el servidor.</p><hr/><div className="security-list"><div><Icon name="lock"/><span><strong>Bloqueo automático</strong><small>5 intentos fallidos · 15 minutos</small></span></div><div><Icon name="clock"/><span><strong>Duración de sesión</strong><small>8 horas</small></span></div><div><Icon name="check"/><span><strong>Contraseñas protegidas</strong><small>Hash bcrypt; nunca se muestran en pantalla</small></span></div></div></section>}
      {section==="Permisos y roles"&&<section className="panel settings-panel"><h2>Permisos y roles</h2><p>Accesos definidos en la interfaz y validados por la API.</p><hr/><div className="permission-grid">{(Object.entries(roleAccess) as [Role,string[]][]).map(([name,pages])=><div key={name}><strong>{name}</strong><span>{pages.join(" · ")}</span></div>)}</div></section>}
    </div>
  </>;
}

function ProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [catalogs,setCatalogs]=useState<any>({categories:[],suppliers:[]});
  const [form,setForm]=useState({name:"",code:"",categoryId:"",unit:"unidades",minimumStock:"0",supplierId:""});
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{api<any>("/catalogs").then(data=>{setCatalogs(data);setForm(current=>({...current,categoryId:String(data.categories[0]?.id || ""),supplierId:String(data.suppliers[0]?.id || "")}))}).catch(e=>setError(e.message));},[]);
  const update=(key:string,value:string)=>setForm({...form,[key]:value});
  const save=async()=>{
    if(!form.name.trim()||!form.code.trim()||!form.categoryId){setError("Completa el nombre, código y categoría.");return}
    if(Number(form.minimumStock)<0){setError("El stock mínimo no puede ser negativo.");return}
    setSaving(true);setError("");
    try {
      await api("/products",{method:"POST",body:JSON.stringify({...form,name:form.name.trim(),code:form.code.trim().toUpperCase(),categoryId:Number(form.categoryId),supplierId:Number(form.supplierId),minimumStock:Number(form.minimumStock)})});
      onSaved(); onClose();
    } catch(caught) { setError(caught instanceof Error?caught.message:"No fue posible guardar el producto."); }
    finally { setSaving(false); }
  };
  return <Modal title="Registrar nuevo producto" onClose={onClose}><div className="modal-body"><div className="form-grid"><label className="field"><span>Nombre del producto *</span><input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Ej. Composite dental A2"/></label><label className="field"><span>Código *</span><input value={form.code} onChange={e=>update("code",e.target.value)} placeholder="ODO-007"/></label><label className="field"><span>Categoría *</span><select value={form.categoryId} onChange={e=>update("categoryId",e.target.value)}>{catalogs.categories.map((item:any)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Unidad de medida *</span><select value={form.unit} onChange={e=>update("unit",e.target.value)}><option value="unidades">Unidades</option><option value="cajas">Cajas</option><option value="frascos">Frascos</option><option value="cárpules">Cárpules</option></select></label><label className="field"><span>Stock mínimo *</span><input value={form.minimumStock} onChange={e=>update("minimumStock",e.target.value)} type="number" min="0"/></label><label className="field"><span>Proveedor preferente</span><select value={form.supplierId} onChange={e=>update("supplierId",e.target.value)}>{catalogs.suppliers.map((item:any)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>{error&&<div className="login-error modal-error"><Icon name="alert" size={16}/>{error}</div>}</div><div className="modal-foot"><Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving?"Guardando...":"Guardar producto"}</Button></div></Modal>;
}

function MovementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type,setType]=useState("Entrada");
  const [catalogs,setCatalogs]=useState<any>({products:[],lots:[]});
  const [form,setForm]=useState({productId:"",lotId:"",quantity:"",reason:""});
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{api<any>("/catalogs").then(data=>{setCatalogs(data);const product=String(data.products[0]?.id || "");const lot=data.lots.find((l:any)=>String(l.productId)===product);setForm(current=>({...current,productId:product,lotId:String(lot?.id || "")}))}).catch(e=>setError(e.message));},[]);
  const lotsForProduct=catalogs.lots.filter((lot:any)=>String(lot.productId)===form.productId);
  const updateProduct=(productId:string)=>setForm({...form,productId,lotId:String(catalogs.lots.find((l:any)=>String(l.productId)===productId)?.id || "")});
  const save=async()=>{
    const quantity=Number(form.quantity);
    if(!form.productId||!form.lotId){setError("Selecciona un producto y un lote válido.");return}
    if(!Number.isFinite(quantity)||quantity===0||(type!=="Ajuste"&&quantity<0)){setError(type==="Ajuste"?"Ingresa una cantidad distinta de cero; usa un valor negativo para reducir stock.":"La cantidad debe ser mayor que cero.");return}
    if((type==="Ajuste"||type==="Salida")&&!form.reason.trim()){setError("Indica el motivo para mantener la trazabilidad del movimiento.");return}
    setSaving(true);setError("");
    try {
      await api("/movements",{method:"POST",body:JSON.stringify({productId:Number(form.productId),lotId:Number(form.lotId),type,quantity,reason:form.reason.trim()})});
      onSaved(); onClose();
    } catch(caught) { setError(caught instanceof Error?caught.message:"No fue posible registrar el movimiento."); }
    finally { setSaving(false); }
  };
  return <Modal title="Registrar movimiento" onClose={onClose}><div className="modal-body"><div className="type-toggle">{["Entrada","Salida","Ajuste"].map(t=><button type="button" className={type===t?"active":""} onClick={()=>setType(t)} key={t}>{t==="Entrada"?<Icon name="arrowUp"/>:t==="Salida"?<Icon name="arrowDown"/>:<Icon name="swap"/>}{t}</button>)}</div><div className="form-grid"><label className="field wide"><span>Producto *</span><select value={form.productId} onChange={e=>updateProduct(e.target.value)}>{catalogs.products.map((item:any)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Lote *</span><select value={form.lotId} onChange={e=>setForm({...form,lotId:e.target.value})}>{lotsForProduct.map((item:any)=><option value={item.id} key={item.id}>{item.lotNumber} · {item.quantity} disp.</option>)}</select></label><label className="field"><span>Cantidad *</span><input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} type="number" step="0.01" placeholder={type==="Ajuste"?"Ej. -5 o 5":"0"}/><small>{type==="Ajuste"?"Usa positivo para sumar y negativo para descontar.":"Debe ser mayor que cero."}</small></label><label className="field wide"><span>Motivo / observación {type!=="Entrada"&&"*"}</span><textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Describe el motivo del movimiento..."/></label></div><div className="notice info-notice"><Icon name="alert"/><span>El stock se actualizará automáticamente y el movimiento quedará registrado en el historial de auditoría.</span></div>{error&&<div className="login-error modal-error"><Icon name="alert" size={16}/>{error}</div>}</div><div className="modal-foot"><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving?"Registrando...":`Registrar ${type.toLowerCase()}`}</Button></div></Modal>;
}

function LotModal({ onClose,onSaved }: { onClose:()=>void;onSaved:()=>void }) {
  const [products,setProducts]=useState<any[]>([]);
  const [form,setForm]=useState({productId:"",lotNumber:"",receivedAt:new Date().toISOString().slice(0,10),expiresAt:""});
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{api<any>("/catalogs").then(data=>{setProducts(data.products);setForm(current=>({...current,productId:String(data.products[0]?.id || "")}))}).catch(e=>setError(e.message));},[]);
  const save=async()=>{if(!form.productId||!form.lotNumber.trim()||!form.expiresAt){setError("Completa todos los campos obligatorios.");return}if(form.expiresAt<form.receivedAt){setError("La fecha de vencimiento no puede ser anterior al ingreso.");return}setSaving(true);setError("");try{await api("/lots",{method:"POST",body:JSON.stringify({...form,lotNumber:form.lotNumber.trim(),productId:Number(form.productId)})});onSaved();onClose()}catch(caught){setError(caught instanceof Error?caught.message:"No fue posible registrar el lote.")}finally{setSaving(false)}};
  return <Modal title="Registrar lote" onClose={onClose}><div className="modal-body"><div className="form-grid"><label className="field wide"><span>Producto *</span><select value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})}>{products.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Número de lote *</span><input value={form.lotNumber} onChange={e=>setForm({...form,lotNumber:e.target.value})} placeholder="Ej. COMP-2026-01"/></label><label className="field"><span>Fecha de ingreso *</span><input type="date" value={form.receivedAt} onChange={e=>setForm({...form,receivedAt:e.target.value})}/></label><label className="field wide"><span>Fecha de vencimiento *</span><input type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/></label></div>{error&&<div className="login-error modal-error"><Icon name="alert" size={16}/>{error}</div>}</div><div className="modal-foot"><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving?"Guardando...":"Guardar lote"}</Button></div></Modal>;
}

function OrderModal({ onClose,onSaved }: { onClose:()=>void;onSaved:()=>void }) {
  const [catalogs,setCatalogs]=useState<any>({suppliers:[],products:[]});
  const [supplierId,setSupplierId]=useState("");
  const [notes,setNotes]=useState("");
  const [lines,setLines]=useState([{productId:"",quantity:"1",unitPrice:""}]);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{api<any>("/catalogs").then(data=>{setCatalogs(data);setSupplierId(String(data.suppliers[0]?.id||""));setLines([{productId:String(data.products[0]?.id||""),quantity:"1",unitPrice:""}])}).catch(e=>setError(e.message));},[]);
  const updateLine=(index:number,key:string,value:string)=>setLines(current=>current.map((line,lineIndex)=>lineIndex===index?{...line,[key]:value}:line));
  const total=lines.reduce((sum,line)=>sum+Number(line.quantity||0)*Number(line.unitPrice||0),0);
  const save=async()=>{
    if(!supplierId||!lines.length||lines.some(line=>!line.productId||Number(line.quantity)<=0||Number(line.unitPrice)<0||line.unitPrice==="")){setError("Selecciona un proveedor y completa cada producto con cantidad y precio válidos.");return}
    if(new Set(lines.map(line=>line.productId)).size!==lines.length){setError("Cada producto puede aparecer una sola vez en la orden.");return}
    setSaving(true);setError("");
    try{await api("/orders",{method:"POST",body:JSON.stringify({supplierId:Number(supplierId),notes:notes.trim(),items:lines.map(line=>({productId:Number(line.productId),quantity:Number(line.quantity),unitPrice:Number(line.unitPrice)}))})});onSaved();onClose()}
    catch(caught){setError(caught instanceof Error?caught.message:"No fue posible crear la orden.")}
    finally{setSaving(false)}
  };
  return <Modal title="Nueva orden de compra" onClose={onClose}><div className="modal-body"><label className="field"><span>Proveedor *</span><select value={supplierId} onChange={e=>setSupplierId(e.target.value)}>{catalogs.suppliers.map((item:any)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="order-lines-head"><div><strong>Productos</strong><small>Agrega todos los insumos de esta orden.</small></div><Button variant="secondary" icon="plus" onClick={()=>setLines(current=>[...current,{productId:String(catalogs.products[0]?.id||""),quantity:"1",unitPrice:""}])}>Agregar producto</Button></div><div className="order-lines">{lines.map((line,index)=><div className="order-line" key={index}><label className="field"><span>Producto *</span><select value={line.productId} onChange={e=>updateLine(index,"productId",e.target.value)}>{catalogs.products.map((item:any)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Cantidad *</span><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={e=>updateLine(index,"quantity",e.target.value)}/></label><label className="field"><span>Precio unitario *</span><input type="number" min="0" step="1" value={line.unitPrice} onChange={e=>updateLine(index,"unitPrice",e.target.value)}/></label><div className="line-total"><span>Subtotal</span><strong>{(Number(line.quantity||0)*Number(line.unitPrice||0)).toLocaleString("es-CL",{style:"currency",currency:"CLP"})}</strong></div>{lines.length>1&&<button className="icon-btn remove-line" aria-label="Quitar producto" onClick={()=>setLines(current=>current.filter((_,lineIndex)=>lineIndex!==index))}><Icon name="close"/></button>}</div>)}</div><div className="order-total"><span>Total estimado</span><strong>{total.toLocaleString("es-CL",{style:"currency",currency:"CLP"})}</strong></div><label className="field"><span>Notas</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Condiciones o comentarios para la compra"/></label>{error&&<div className="login-error modal-error"><Icon name="alert" size={16}/>{error}</div>}</div><div className="modal-foot"><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving?"Creando orden...":"Crear orden"}</Button></div></Modal>;
}

function UserModal({ onClose,onSaved }: { onClose:()=>void;onSaved:()=>void }) {
  const [form,setForm]=useState({name:"",email:"",password:"",roleId:"2"});
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const save=async()=>{if(form.name.trim().length<3||!form.email.includes("@")||form.password.length<8){setError("Ingresa un nombre válido, un correo válido y una contraseña de al menos 8 caracteres.");return}setSaving(true);setError("");try{await api("/users",{method:"POST",body:JSON.stringify({...form,name:form.name.trim(),email:form.email.trim().toLowerCase(),roleId:Number(form.roleId)})});onSaved();onClose()}catch(caught){setError(caught instanceof Error?caught.message:"No fue posible crear el usuario.")}finally{setSaving(false)}};
  const roleName=(["Administrador","Encargado de Bodega","Comprador","Auditor"] as Role[])[Number(form.roleId)-1];
  return <Modal title="Nuevo usuario" onClose={onClose}><div className="modal-body"><div className="form-grid"><label className="field"><span>Nombre completo *</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="field"><span>Correo *</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label className="field"><span>Rol *</span><select value={form.roleId} onChange={e=>setForm({...form,roleId:e.target.value})}><option value="1">Administrador</option><option value="2">Encargado de Bodega</option><option value="3">Comprador</option><option value="4">Auditor</option></select></label><label className="field"><span>Contraseña temporal *</span><input type="password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><small>Mínimo 8 caracteres.</small></label></div><div className="role-preview"><strong>Acceso de {roleName}</strong><p>{roleAccess[roleName].join(" · ")}</p></div>{error&&<div className="login-error modal-error"><Icon name="alert" size={16}/>{error}</div>}</div><div className="modal-foot"><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving?"Creando...":"Crear usuario"}</Button></div></Modal>;
}

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [page, setPage] = useState("Resumen");
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState<"product"|"movement"|"lot"|"order"|"user"|null>(null);
  const [query,setQuery]=useState("");
  const [dataVersion,setDataVersion]=useState(0);
  const [alertCount,setAlertCount]=useState(0);
  const visibleNav = account ? nav.filter((item) => roleAccess[account.role].includes(item.label)) : [];
  useEffect(()=>{if(account&&roleAccess[account.role].includes("Alertas"))api<any[]>("/alerts").then(rows=>setAlertCount(rows.filter(item=>item.status==="Pendiente").length)).catch(()=>{});},[account,dataVersion]);

  const logout = async () => {
    try { await api("/auth/logout",{method:"POST"}); } catch { /* La sesión local se cierra igualmente. */ }
    authToken = "";
    setAccount(null);
    setPage("Resumen");
    setSidebar(false);
    setModal(null);
  };

  const pageContent = useMemo(() => {
    if (!account) return null;
    if(page==="Resumen") return <Dashboard setPage={setPage} openMovement={()=>setModal("movement")} account={account}/>;
    if(page==="Productos") return <Products query={query} setQuery={setQuery} onAdd={()=>setModal("product")} canEdit={account.role==="Administrador"} version={dataVersion}/>;
    if(page==="Movimientos") return <Movements onAdd={()=>setModal("movement")} canEdit={["Administrador","Encargado de Bodega"].includes(account.role)} version={dataVersion}/>;
    if(page==="Lotes y vencimientos") return <Lots canEdit={["Administrador","Encargado de Bodega"].includes(account.role)} onAdd={()=>setModal("lot")} version={dataVersion}/>;
    if(page==="Alertas") return <Alerts onChange={setAlertCount}/>;
    if(page==="Órdenes de compra") return <Orders onAdd={()=>setModal("order")} version={dataVersion}/>;
    if(page==="Reportes") return <Reports/>;
    if(page==="Usuarios") return <Users onAdd={()=>setModal("user")} version={dataVersion}/>;
    return <Settings/>;
  }, [page,query,account,dataVersion]);

  if (!account) return <Login onLogin={(selected,token)=>{authToken=token;setAccount(selected);setPage("Resumen")}}/>;

  return <div className="app-shell">
    <aside className={`sidebar ${sidebar?"open":""}`}>
      <div className="brand"><img src="/logo-clinica-maro.png" alt="Clínica Dental Maró"/></div>
      <nav>{visibleNav.map(n=><button key={n.label} className={page===n.label?"active":""} onClick={()=>{setPage(n.label);setSidebar(false)}}><Icon name={n.icon}/><span>{n.label}</span>{n.label==="Alertas"&&alertCount>0&&<i>{alertCount}</i>}</button>)}</nav>
      <div className="clinic-card"><span><Icon name="tooth"/></span><div><strong>Clínica Maró</strong><small>Temuco, Chile</small></div></div>
      <div className="profile"><span className="avatar">{account.initials}</span><div><strong>{account.name}</strong><small>{account.role}</small></div><button className="profile-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18}/></button></div>
    </aside>
    {sidebar&&<div className="mobile-overlay" onClick={()=>setSidebar(false)}/>}
    <main><div className="mobile-top"><button className="icon-btn" onClick={()=>setSidebar(true)}><Icon name="menu"/></button><div className="brand compact"><img src="/logo-clinica-maro.png" alt="Clínica Dental Maró"/></div><button className="icon-btn" onClick={()=>setPage("Alertas")}><Icon name="bell"/></button></div><div className="content">{pageContent}</div></main>
    {modal==="product"&&<ProductModal onClose={()=>setModal(null)} onSaved={()=>setDataVersion(value=>value+1)}/>}
    {modal==="movement"&&<MovementModal onClose={()=>setModal(null)} onSaved={()=>setDataVersion(value=>value+1)}/>}
    {modal==="lot"&&<LotModal onClose={()=>setModal(null)} onSaved={()=>setDataVersion(value=>value+1)}/>}
    {modal==="order"&&<OrderModal onClose={()=>setModal(null)} onSaved={()=>setDataVersion(value=>value+1)}/>}
    {modal==="user"&&<UserModal onClose={()=>setModal(null)} onSaved={()=>setDataVersion(value=>value+1)}/>}
  </div>;
}
