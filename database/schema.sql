CREATE DATABASE IF NOT EXISTS clinica_maro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica_maro;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TINYINT UNSIGNED NOT NULL,
  permission_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_expiration (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(150) NOT NULL,
  tax_id VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  preferred_supplier_id INT UNSIGNED NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  minimum_stock DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_product_supplier FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  lot_number VARCHAR(60) NOT NULL,
  received_at DATE NOT NULL,
  expires_at DATE NOT NULL,
  quantity DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_lot (product_id, lot_number),
  INDEX idx_lot_expiration (expires_at),
  CONSTRAINT chk_lot_dates CHECK (expires_at >= received_at),
  CONSTRAINT fk_lot_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  lot_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  movement_type ENUM('Entrada','Salida','Ajuste positivo','Ajuste negativo','Anulación') NOT NULL,
  quantity DECIMAL(12,2) UNSIGNED NOT NULL,
  reason VARCHAR(255) NULL,
  reference_movement_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movement_date (created_at),
  CONSTRAINT chk_movement_quantity CHECK (quantity > 0),
  CONSTRAINT fk_movement_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_movement_lot FOREIGN KEY (lot_id) REFERENCES lots(id),
  CONSTRAINT fk_movement_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_movement_reference FOREIGN KEY (reference_movement_id) REFERENCES inventory_movements(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  supplier_id INT UNSIGNED NOT NULL,
  buyer_id INT UNSIGNED NOT NULL,
  status ENUM('Borrador','Enviada','Recibida','Anulada') NOT NULL DEFAULT 'Borrador',
  issued_at DATE NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(12,2) UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) UNSIGNED NOT NULL,
  UNIQUE KEY uq_order_product (purchase_order_id, product_id),
  CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
  CONSTRAINT fk_order_item_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  lot_id BIGINT UNSIGNED NULL,
  alert_type ENUM('Stock mínimo','Vencimiento') NOT NULL,
  message VARCHAR(255) NOT NULL,
  status ENUM('Pendiente','Revisada') NOT NULL DEFAULT 'Pendiente',
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alert_status (status),
  CONSTRAINT fk_alert_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_alert_lot FOREIGN KEY (lot_id) REFERENCES lots(id),
  CONSTRAINT fk_alert_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS trg_movement_validate;
DELIMITER $$
CREATE TRIGGER trg_movement_validate BEFORE INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  DECLARE lot_product INT UNSIGNED;
  DECLARE current_quantity DECIMAL(12,2);
  SELECT product_id, quantity INTO lot_product, current_quantity FROM lots WHERE id = NEW.lot_id FOR UPDATE;
  IF lot_product IS NULL OR lot_product <> NEW.product_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El lote no corresponde al producto';
  END IF;
  IF NEW.movement_type IN ('Salida','Ajuste negativo') AND current_quantity < NEW.quantity THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente en el lote';
  END IF;
  IF NEW.movement_type LIKE 'Ajuste%' AND (NEW.reason IS NULL OR CHAR_LENGTH(TRIM(NEW.reason)) = 0) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los ajustes requieren un motivo';
  END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_movement_apply;
DELIMITER $$
CREATE TRIGGER trg_movement_apply AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  UPDATE lots
  SET quantity = quantity + CASE
    WHEN NEW.movement_type IN ('Entrada','Ajuste positivo') THEN NEW.quantity
    ELSE -NEW.quantity
  END
  WHERE id = NEW.lot_id;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_movement_no_update;
DELIMITER $$
CREATE TRIGGER trg_movement_no_update BEFORE UPDATE ON inventory_movements
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos no se pueden modificar; registre una anulación'$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_movement_no_delete;
DELIMITER $$
CREATE TRIGGER trg_movement_no_delete BEFORE DELETE ON inventory_movements
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos no se pueden eliminar; registre una anulación'$$
DELIMITER ;

CREATE OR REPLACE VIEW v_current_stock AS
SELECT p.id, p.code, p.name, p.minimum_stock,
       COALESCE(SUM(CASE WHEN l.expires_at >= CURRENT_DATE THEN l.quantity ELSE 0 END),0) available_stock,
       COALESCE(SUM(l.quantity),0) total_stock
FROM products p LEFT JOIN lots l ON l.product_id = p.id
WHERE p.active = TRUE GROUP BY p.id, p.code, p.name, p.minimum_stock;

CREATE OR REPLACE VIEW v_products_below_minimum AS
SELECT * FROM v_current_stock WHERE available_stock < minimum_stock;

CREATE OR REPLACE VIEW v_expiring_lots AS
SELECT l.*, p.name product_name, DATEDIFF(l.expires_at,CURRENT_DATE) days_remaining
FROM lots l JOIN products p ON p.id=l.product_id
WHERE l.quantity > 0 AND l.expires_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY);

CREATE OR REPLACE VIEW v_movement_history AS
SELECT m.id, p.name product_name, l.lot_number, m.movement_type, m.quantity, m.reason,
       m.reference_movement_id, u.name user_name, m.created_at
FROM inventory_movements m
JOIN products p ON p.id=m.product_id JOIN lots l ON l.id=m.lot_id JOIN users u ON u.id=m.user_id;
