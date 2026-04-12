CREATE TABLE IF NOT EXISTS autopilot_settings (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO autopilot_settings (prompt) VALUES ('');
