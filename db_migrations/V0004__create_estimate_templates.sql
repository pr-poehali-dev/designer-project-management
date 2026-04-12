CREATE TABLE IF NOT EXISTS estimate_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estimate_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES estimate_templates(id),
    name VARCHAR(500) NOT NULL DEFAULT '',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'шт',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);
