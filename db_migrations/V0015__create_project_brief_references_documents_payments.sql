-- Бриф проекта (заполняет дизайнер, видит клиент)
CREATE TABLE IF NOT EXISTS project_briefs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) UNIQUE,
    style VARCHAR(255) DEFAULT '',
    area NUMERIC(10,2) DEFAULT 0,
    budget NUMERIC(12,2) DEFAULT 0,
    rooms TEXT DEFAULT '',
    wishes TEXT DEFAULT '',
    color_palette TEXT DEFAULT '',
    furniture TEXT DEFAULT '',
    restrictions TEXT DEFAULT '',
    extra TEXT DEFAULT '',
    client_comment TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Референсы (загружает клиент)
CREATE TABLE IF NOT EXISTS project_references (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    uploaded_by VARCHAR(50) NOT NULL DEFAULT 'client',
    url TEXT NOT NULL DEFAULT '',
    caption TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_references_project_id ON project_references(project_id);

-- Документы проекта (загружают обе стороны)
CREATE TABLE IF NOT EXISTS project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    uploaded_by VARCHAR(50) NOT NULL DEFAULT 'designer',
    name VARCHAR(255) NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    doc_type VARCHAR(50) DEFAULT 'other',
    is_signed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Платежи по проекту (управляет дизайнер, видит клиент)
CREATE TABLE IF NOT EXISTS project_payments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    label VARCHAR(255) DEFAULT '',
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_payments_project_id ON project_payments(project_id);
