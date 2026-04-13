CREATE TABLE IF NOT EXISTS doc_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
