ALTER TABLE project_estimates ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_estimates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Основная смета (work_items без estimate_id) тоже нужна флаговая строка
-- Добавляем флаг в projects для утверждения основной сметы
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_estimate_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_estimate_approved_at TIMESTAMP;
