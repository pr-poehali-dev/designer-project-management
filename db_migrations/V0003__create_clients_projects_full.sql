CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL DEFAULT '',
    contact_person VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    legal_form VARCHAR(50) NOT NULL DEFAULT 'individual',
    company_name VARCHAR(500) NOT NULL DEFAULT '',
    inn VARCHAR(20) NOT NULL DEFAULT '',
    ogrn VARCHAR(20) NOT NULL DEFAULT '',
    kpp VARCHAR(20) NOT NULL DEFAULT '',
    legal_address TEXT NOT NULL DEFAULT '',
    bank_name VARCHAR(255) NOT NULL DEFAULT '',
    bik VARCHAR(20) NOT NULL DEFAULT '',
    checking_account VARCHAR(30) NOT NULL DEFAULT '',
    corr_account VARCHAR(30) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL DEFAULT '',
    client_id INTEGER REFERENCES clients(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    deadline DATE,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    name VARCHAR(500) NOT NULL DEFAULT '',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'шт',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_team (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    member_name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    project_id INTEGER REFERENCES projects(id),
    doc_type VARCHAR(50) NOT NULL DEFAULT 'other',
    name VARCHAR(500) NOT NULL DEFAULT '',
    file_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);
