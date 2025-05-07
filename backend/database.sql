-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  company VARCHAR(100),
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de reglas de validación
CREATE TABLE IF NOT EXISTS validation_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  rules_json JSON NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla de análisis
CREATE TABLE IF NOT EXISTS analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  stats_json JSON,
  data_json JSON,
  total_processors INT,
  meeting_requirements INT,
  compliance_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla para compartir análisis entre usuarios
CREATE TABLE IF NOT EXISTS shared_analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  shared_by INT NOT NULL,
  shared_with INT NOT NULL,
  permissions ENUM('read', 'edit') DEFAULT 'read',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar usuario administrador por defecto
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@hardware-normalizer.com', '$2b$10$s4F1XBzxhGQvTmBnKMDk6eEk/ZW38l1VJ1Ve5uwTXJoxEO5G7z9Ja', 'admin');
-- Contraseña: admin123
