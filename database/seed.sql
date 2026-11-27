USE clinica_maro;

INSERT IGNORE INTO roles (id,name) VALUES
(1,'Administrador'),(2,'Encargado de Bodega'),(3,'Comprador'),(4,'Auditor');

INSERT IGNORE INTO permissions (id,code,description) VALUES
(1,'users.manage','Gestionar usuarios'),(2,'products.manage','Gestionar productos'),
(3,'inventory.read','Consultar productos y stock'),(4,'movements.create','Registrar movimientos'),
(5,'movements.cancel','Anular movimientos'),(6,'orders.manage','Gestionar órdenes de compra'),
(7,'alerts.read','Ver alertas'),(8,'reports.read','Ver reportes e historial'),
(9,'settings.manage','Modificar configuración');

INSERT IGNORE INTO role_permissions VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),
(2,3),(2,4),(2,7),(3,3),(3,6),(3,7),(4,3),(4,7),(4,8);

INSERT INTO users (id,role_id,name,email,password_hash) VALUES
(1,1,'Valentina Marín','admin@clinicamaro.cl','$2b$10$UzORKbvGu9QZVBfhNASdpeR0haia5TTk3jGymKemtdbW///hscQUS'),
(2,2,'Carolina Soto','bodega@clinicamaro.cl','$2b$10$Bb4W6v7nKmROXneMFk0taeY6w50uo1EY2EP7RvLIPAjEH3TckqAse'),
(3,3,'Paula Reyes','compras@clinicamaro.cl','$2b$10$Ib0pawKouPq1ZjW7rGyxoeb3J8S/cuwkrwnHxZmMfgig059HuOzZ6'),
(4,4,'Matías Rojas','auditor@clinicamaro.cl','$2b$10$RjSSW0mgDoYNLAmYhYOGaONQrSGP6Utdt0ZMcja/0ITEMJ6Lo4L56')
ON DUPLICATE KEY UPDATE name=VALUES(name),role_id=VALUES(role_id),password_hash=VALUES(password_hash),active=TRUE;

INSERT IGNORE INTO settings VALUES
('expiration_warning_days','30','Días de anticipación para alertas de vencimiento',CURRENT_TIMESTAMP),
('minimum_stock_alerts','true','Activa las alertas de stock mínimo',CURRENT_TIMESTAMP),
('daily_summary','true','Activa el resumen diario',CURRENT_TIMESTAMP);

INSERT IGNORE INTO categories (id,name) VALUES (1,'Protección'),(2,'Soluciones'),(3,'Curación'),(4,'Inyección'),(5,'Odontología');
INSERT IGNORE INTO suppliers (id,business_name,tax_id,email,phone) VALUES
(1,'Dental Sur SpA','76.123.456-7','ventas@dentalsur.cl','+56 45 222 1100'),
(2,'Insumos Médicos Araucanía','77.987.654-3','contacto@insumosaraucania.cl','+56 45 255 9900');
INSERT IGNORE INTO products (id,category_id,preferred_supplier_id,code,name,unit,minimum_stock) VALUES
(1,1,2,'INS-001','Guantes de nitrilo','unidades',100),(2,1,2,'INS-002','Mascarilla quirúrgica','unidades',15),
(3,2,2,'INS-003','Suero fisiológico 0,9%','frascos',40),(4,3,2,'INS-004','Gasa estéril 10×10','paquetes',50),
(5,4,2,'INS-005','Jeringa desechable 5 ml','unidades',150),(6,5,1,'ODO-006','Anestesia dental','cárpules',30);
INSERT IGNORE INTO lots (id,product_id,lot_number,received_at,expires_at,quantity) VALUES
(1,1,'GN-2026-03','2025-05-10',DATE_ADD(CURRENT_DATE,INTERVAL 20 DAY),0),
(2,2,'MQ-2026-02','2025-04-18','2026-02-20',0),(3,3,'SF-2026-01','2025-03-10','2026-01-15',0),
(4,4,'GE-2026-04','2025-05-02','2026-04-22',0),(5,5,'JE-2027-01','2025-05-15','2027-01-12',0),
(6,6,'AN-2025-08','2025-05-20',DATE_ADD(CURRENT_DATE,INTERVAL 36 DAY),0);
INSERT IGNORE INTO inventory_movements (id,product_id,lot_id,user_id,movement_type,quantity,reason) VALUES
(1,1,1,2,'Entrada',30,'Carga inicial'),(2,2,2,2,'Entrada',25,'Carga inicial'),
(3,3,3,2,'Entrada',25,'Carga inicial'),(4,4,4,2,'Entrada',80,'Carga inicial'),
(5,5,5,2,'Entrada',495,'Carga inicial'),(6,6,6,2,'Entrada',18,'Carga inicial');
INSERT IGNORE INTO alerts (id,product_id,lot_id,alert_type,message) VALUES
(1,3,NULL,'Stock mínimo','25 unidades disponibles, por debajo del mínimo definido de 40.'),
(2,1,1,'Vencimiento','El lote GN-2026-03 vencerá dentro del período configurado.'),
(3,6,NULL,'Stock mínimo','18 cárpules disponibles, por debajo del mínimo definido de 30.');
