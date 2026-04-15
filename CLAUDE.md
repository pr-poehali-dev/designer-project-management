# Справочник сущностей проектов

Этот файл описывает бизнес-сущности, которые используются в проектах пользователя.
Юра (ИИ-разработчик) читает этот файл чтобы понимать структуру данных и не переизобретать её каждый раз.

---

## Сущность: Клиент

### Список клиентов (вкладка "Клиенты")

**Элементы интерфейса:**
- Кнопка "Добавить" (иконка UserPlus) — открывает быстрое поле ввода имени
- Поиск в реальном времени по полям `name` и `contact_person`
- Адаптивная сетка карточек: 1 колонка (мобильный) / 2 (планшет) / 3 (десктоп)

**Карточка клиента содержит:**
- Круглый аватар с инициалами (чёрный фон, белый текст)
- Название клиента
- Статус (цветной бейдж):
  - `new` — Новый (синий: bg-blue-50, text-blue-600)
  - `active` — Активный (зелёный: bg-green-50, text-green-600)
  - `vip` — VIP (жёлтый: bg-amber-50, text-amber-700)
  - `inactive` — Неактивный (серый: bg-gray-100, text-ink-faint)
- Контактное лицо (если указано)
- Email (если указан)
- Количество проектов
- Иконка стрелки вправо

**Состояния:**
- Спиннер при загрузке
- "Клиентов пока нет" — если список пуст
- "Ничего не найдено" — если поиск не дал результатов

---

### Карточка клиента (открывается при клике)

Переход внутри того же компонента (состояние `selectedId`), список скрывается.

**Заголовок:**
- Кнопка "Назад"
- Аватар с инициалами
- Название клиента
- Контактное лицо или email
- Кнопка "Создать проект" (справа)

**Вкладки:**

| Вкладка | Иконка | Содержимое |
|---|---|---|
| Данные | User | Редактирование всех полей клиента |
| Заметки | StickyNote | Добавление и просмотр заметок |
| Проекты | FolderKanban | Список проектов + кнопка "Создать новый проект" |
| Документы | FileText | Документы из проектов клиента |
| Чаты | MessageSquare | В разработке (интеграция с Авито) |

---

### Поля клиента

#### Контактные данные
| Поле | Тип | Описание |
|---|---|---|
| `name` | VARCHAR(500) | Имя / Название (обязательное) |
| `contact_person` | VARCHAR(255) | Контактное лицо |
| `phone` | VARCHAR(50) | Телефон (+7 (999) 123-45-67) |
| `email` | VARCHAR(255) | Email |
| `status` | VARCHAR(50) | new / active / vip / inactive |

#### Юридические данные
| Поле | Тип | Описание |
|---|---|---|
| `legal_form` | VARCHAR(50) | individual / self_employed / ip / ooo |
| `company_name` | VARCHAR(500) | Название организации (для ИП и ООО) |
| `inn` | VARCHAR(20) | ИНН |
| `ogrn` | VARCHAR(20) | ОГРН (для ООО и ИП) |
| `kpp` | VARCHAR(20) | КПП (только для ООО) |
| `legal_address` | TEXT | Юридический адрес |

#### Банковские реквизиты (только для организаций)
| Поле | Тип | Описание |
|---|---|---|
| `bank_name` | VARCHAR(255) | Банк |
| `bik` | VARCHAR(20) | БИК |
| `checking_account` | VARCHAR(30) | Расчётный счёт |
| `corr_account` | VARCHAR(30) | Корреспондентский счёт |

#### Прочее
| Поле | Тип | Описание |
|---|---|---|
| `notes` | TEXT | Заметки (свободный текст) |
| `designer_id` | INTEGER | FK → designers(id) |
| `created_at` | TIMESTAMP | Дата создания |
| `updated_at` | TIMESTAMP | Дата обновления |

---

### Схема БД (таблица `clients`)

```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    designer_id INTEGER REFERENCES designers(id),
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
```

---

### API (бэкенд)

Все запросы требуют заголовок: `X-Designer-Token` (JWT токен)

| Метод | URL | Действие |
|---|---|---|
| GET | `/crm-data?action=clients` | Список всех клиентов (+ `project_count`) |
| GET | `/crm-data?action=clients&id=123` | Детали клиента + проекты + заметки + документы |
| POST | `/crm-data?action=clients` | Создать клиента (обязательно: `name`) |
| PUT | `/crm-data?action=clients&id=123` | Обновить клиента (частичное обновление) |

---

### Действия с клиентом

1. **Создать** — быстрая форма с полем `name`, остальное заполняется потом
2. **Редактировать** — все поля на вкладке "Данные", сохранение кнопкой "Сохранить"
3. **Добавить заметку** — вкладка "Заметки", ввод + Enter или кнопка
4. **Создать проект** — кнопка в заголовке карточки или вкладка "Проекты"
5. **Поиск** — по `name` и `contact_person` в реальном времени

---

*Файл обновляется по мере описания новых сущностей.*
