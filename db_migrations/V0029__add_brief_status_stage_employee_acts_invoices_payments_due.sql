ALTER TABLE project_briefs ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS object_comment TEXT;
ALTER TABLE project_stages ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
ALTER TABLE project_stages ADD COLUMN IF NOT EXISTS label VARCHAR(500);
CREATE TABLE IF NOT EXISTS project_acts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(500) NOT NULL DEFAULT 'Акт выполненных работ',
  amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS project_invoices (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(500) NOT NULL DEFAULT 'Счёт',
  amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE project_payments ADD COLUMN IF NOT EXISTS due_date DATE;
