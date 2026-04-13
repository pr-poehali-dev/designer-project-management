CREATE TABLE IF NOT EXISTS brief_template (
    id SERIAL PRIMARY KEY,
    fields JSONB NOT NULL DEFAULT '[]',
    intro TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO brief_template (fields, intro) VALUES ('[]', '') ON CONFLICT DO NOTHING;
