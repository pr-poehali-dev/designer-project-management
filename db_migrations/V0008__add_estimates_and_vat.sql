CREATE TABLE IF NOT EXISTS project_estimates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(500) NOT NULL DEFAULT 'Основная смета',
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    vat_mode VARCHAR(20) NOT NULL DEFAULT 'none',
    vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE work_items ADD COLUMN IF NOT EXISTS estimate_id INTEGER REFERENCES project_estimates(id);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS vat_mode VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20;
