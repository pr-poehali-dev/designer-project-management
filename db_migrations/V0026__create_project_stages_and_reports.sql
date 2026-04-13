CREATE TABLE IF NOT EXISTS project_stages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    stage_key VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment TEXT NOT NULL DEFAULT '',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, stage_key)
);

CREATE TABLE IF NOT EXISTS stage_reports (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL REFERENCES project_stages(id),
    project_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'photo',
    url TEXT NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);