CREATE TABLE IF NOT EXISTS internal_chats (
    id SERIAL PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL DEFAULT '',
    participant_initials VARCHAR(10) NOT NULL DEFAULT '',
    participant_avatar TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES internal_chats(id),
    from_me BOOLEAN NOT NULL DEFAULT TRUE,
    text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_messages_chat_id ON internal_messages(chat_id);
