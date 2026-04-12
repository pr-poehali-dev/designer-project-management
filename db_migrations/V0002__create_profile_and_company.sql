CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    position VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO user_profile (full_name, email) VALUES ('', '');

CREATE TABLE IF NOT EXISTS company_info (
    id SERIAL PRIMARY KEY,
    legal_form VARCHAR(50) NOT NULL DEFAULT 'self_employed',
    company_name VARCHAR(500) NOT NULL DEFAULT '',
    inn VARCHAR(20) NOT NULL DEFAULT '',
    ogrn VARCHAR(20) NOT NULL DEFAULT '',
    kpp VARCHAR(20) NOT NULL DEFAULT '',
    legal_address TEXT NOT NULL DEFAULT '',
    actual_address TEXT NOT NULL DEFAULT '',
    bank_name VARCHAR(255) NOT NULL DEFAULT '',
    bik VARCHAR(20) NOT NULL DEFAULT '',
    checking_account VARCHAR(30) NOT NULL DEFAULT '',
    corr_account VARCHAR(30) NOT NULL DEFAULT '',
    director_name VARCHAR(255) NOT NULL DEFAULT '',
    contact_phone VARCHAR(50) NOT NULL DEFAULT '',
    contact_email VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO company_info (legal_form) VALUES ('self_employed');
