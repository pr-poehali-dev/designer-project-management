CREATE TABLE IF NOT EXISTS project_stages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    stage_key VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, stage_key)
);

CREATE TABLE IF NOT EXISTS stage_files (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL REFERENCES project_stages(id),
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    mime VARCHAR(100) NOT NULL DEFAULT '',
    file_type VARCHAR(20) NOT NULL DEFAULT 'photo',
    created_at TIMESTAMP DEFAULT NOW()
);