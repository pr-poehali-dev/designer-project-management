CREATE TABLE IF NOT EXISTS client_messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    from_me BOOLEAN NOT NULL DEFAULT TRUE,
    text TEXT NOT NULL DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_unread ON client_messages(client_id, is_read) WHERE is_read = FALSE;
