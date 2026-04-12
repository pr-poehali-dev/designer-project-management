CREATE TABLE IF NOT EXISTS project_chats (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES project_chats(id),
    name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    color VARCHAR(20) NOT NULL DEFAULT '#111111',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES project_chats(id),
    member_id INTEGER REFERENCES project_chat_members(id),
    author_name VARCHAR(255) NOT NULL DEFAULT '',
    author_role VARCHAR(50) NOT NULL DEFAULT 'member',
    text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_chats_project_id_idx ON project_chats(project_id);
