
-- Таблица дизайнеров (владельцев аккаунтов)
CREATE TABLE designers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Добавляем designer_id во все основные таблицы
ALTER TABLE company_info ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE user_profile ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE clients ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE projects ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE tasks ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE work_items ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE estimate_templates ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE partners ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE doc_templates ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE autopilot_settings ADD COLUMN designer_id INTEGER REFERENCES designers(id);
ALTER TABLE brief_template ADD COLUMN designer_id INTEGER REFERENCES designers(id);
