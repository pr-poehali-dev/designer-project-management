import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useTheme, THEMES, ThemeId } from "@/context/ThemeContext";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

interface Profile {
  full_name: string;
  phone: string;
  email: string;
  position: string;
  assistant_name: string;
  assistant_gender: string;
}

const TARIFFS = [
  { id: "free", name: "Бесплатный", price: "0 ₽/мес", features: ["1 пользователь", "50 клиентов", "Базовые отчёты"] },
  { id: "business", name: "Бизнес", price: "1 990 ₽/мес", features: ["5 пользователей", "Без лимитов", "Автопилот", "Все интеграции"], current: true },
  { id: "pro", name: "Премиум", price: "4 990 ₽/мес", features: ["Без ограничений", "Приоритетная поддержка", "API доступ", "Кастом брендинг"] },
];

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", email: "", position: "", assistant_name: "", assistant_gender: "male" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new_pass: "", confirm: "" });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=profile`);
      const data = await r.json();
      if (data.ok) {
        const p = data.profile;
        setProfile({ full_name: p.full_name || "", phone: p.phone || "", email: p.email || "", position: p.position || "", assistant_name: p.assistant_name || "", assistant_gender: p.assistant_gender || "male" });
        setSaved({ full_name: p.full_name || "", phone: p.phone || "", email: p.email || "", position: p.position || "", assistant_name: p.assistant_name || "", assistant_gender: p.assistant_gender || "male" });
        if (p.theme) setTheme(p.theme as ThemeId);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveProfile = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${API}?action=profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, theme }),
      });
      const data = await r.json();
      if (data.ok) {
        setSaved({ ...profile });
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch { setStatus("error"); } finally { setSaving(false); }
  };

  const hasChanges = saved && JSON.stringify(profile) !== JSON.stringify(saved);

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-ink flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.full_name || "Ваше имя"}</h2>
            <p className="text-sm text-ink-faint">{profile.position || "Должность не указана"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Полное имя" icon="User" value={profile.full_name}
            onChange={v => setProfile(p => ({ ...p, full_name: v }))} placeholder="Иванов Иван Иванович" />
          <Field label="Телефон" icon="Phone" value={profile.phone}
            onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="+7 (999) 123-45-67" />
          <Field label="Email" icon="Mail" value={profile.email}
            onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="your@email.com" />
          <Field label="Должность" icon="Briefcase" value={profile.position}
            onChange={v => setProfile(p => ({ ...p, position: v }))} placeholder="Директор" />
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-muted mb-1.5 flex items-center gap-1.5">
              <span className="text-base">✦</span> AI-помощник
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-snow-dark rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors bg-snow"
                placeholder="Жарвис"
                value={profile.assistant_name}
                onChange={e => setProfile(p => ({ ...p, assistant_name: e.target.value }))}
              />
              <div className="flex rounded-xl border border-snow-dark overflow-hidden shrink-0">
                {[{ id: "male", label: "♂ Муж", icon: "👨" }, { id: "female", label: "♀ Жен", icon: "👩" }].map(g => (
                  <button key={g.id} type="button"
                    onClick={() => setProfile(p => ({ ...p, assistant_gender: g.id }))}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      profile.assistant_gender === g.id
                        ? "bg-ink text-white"
                        : "bg-snow text-ink-muted hover:bg-snow-dark"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-ink-faint mt-1">
              Имя и пол определяют голос помощника
              {profile.assistant_gender === "male" ? " — глубокий мужской (Onyx)" : " — женский (Nova)"}
            </p>
          </div>
        </div>

        {/* Тема оформления */}
        <div className="mt-6 pt-6 border-t border-snow-dark">
          <label className="block text-xs font-medium text-ink-muted mb-4 flex items-center gap-1.5">
            <Icon name="Palette" size={14} /> Тема оформления
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEMES.map(t => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-200 text-left ${
                    active ? "ring-2 shadow-lg scale-[1.02]" : "hover:scale-[1.01] hover:shadow-md"
                  }`}
                  style={{ ringColor: t.accent } as React.CSSProperties}
                >
                  {/* Превью интерфейса */}
                  <div className="h-24 relative overflow-hidden" style={{ background: t.bg }}>
                    {/* Мини-сайдбар */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col gap-1 p-1 pt-2" style={{ background: t.sidebar }}>
                      <div className="h-1.5 rounded-full mx-0.5" style={{ background: t.accent, opacity: 0.9 }} />
                      <div className="h-1 rounded-full mx-0.5" style={{ background: t.textMuted, opacity: 0.3 }} />
                      <div className="h-1 rounded-full mx-0.5" style={{ background: t.textMuted, opacity: 0.3 }} />
                      <div className="h-1 rounded-full mx-0.5" style={{ background: t.textMuted, opacity: 0.3 }} />
                    </div>
                    {/* Мини-контент */}
                    <div className="absolute left-9 right-1 top-2 space-y-1.5">
                      <div className="h-2 rounded" style={{ background: t.text, opacity: 0.15, width: "50%" }} />
                      {/* Карточки */}
                      <div className="grid grid-cols-2 gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="rounded p-1 space-y-0.5" style={{ background: t.card, border: `1px solid ${t.textMuted}22` }}>
                            <div className="h-1 rounded" style={{ background: t.text, opacity: 0.12, width: "70%" }} />
                            <div className="h-1 rounded" style={{ background: t.textMuted, opacity: 0.2, width: "45%" }} />
                          </div>
                        ))}
                      </div>
                      {/* Кнопка */}
                      <div className="h-3 rounded-full w-12" style={{ background: t.accent, opacity: 0.9 }} />
                    </div>
                  </div>

                  {/* Подпись */}
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background: t.sidebar }}>
                    <div>
                      <p className="text-xs font-semibold leading-none" style={{ color: t.text }}>{t.label}</p>
                      <div className="flex gap-1 mt-1.5">
                        {[t.accent, t.bg, t.sidebar].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border" style={{ background: c, borderColor: `${t.textMuted}40` }} />
                        ))}
                      </div>
                    </div>
                    {active && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
                        <Icon name="Check" size={11} style={{ color: t.dark ? t.bg : "#fff" }} />
                      </div>
                    )}
                  </div>

                  {/* Рамка активной темы */}
                  {active && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 0 2px ${t.accent}` }} />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint mt-3">Изменения применяются сразу, сохраняются при нажатии «Сохранить»</p>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-snow-dark">
          <div>
            {status === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Icon name="Check" size={14} /> Сохранено
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <Icon name="AlertCircle" size={14} /> Ошибка сохранения
              </span>
            )}
          </div>
          <button onClick={saveProfile} disabled={saving || !hasChanges}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={16} />}
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
              <Icon name="Lock" size={18} className="text-ink-muted" />
            </div>
            <div>
              <h3 className="font-semibold">Смена пароля</h3>
              <p className="text-xs text-ink-faint">Измените пароль для входа в систему</p>
            </div>
          </div>
          <button onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-ink-muted hover:text-ink font-medium transition-colors">
            {showPassword ? "Скрыть" : "Изменить пароль"}
          </button>
        </div>

        {showPassword && (
          <div className="space-y-4 animate-fade-in">
            <Field label="Текущий пароль" icon="KeyRound" value={passwords.current}
              onChange={v => setPasswords(p => ({ ...p, current: v }))} placeholder="••••••••" type="password" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Новый пароль" icon="KeyRound" value={passwords.new_pass}
                onChange={v => setPasswords(p => ({ ...p, new_pass: v }))} placeholder="Минимум 8 символов" type="password" />
              <Field label="Повторите пароль" icon="KeyRound" value={passwords.confirm}
                onChange={v => setPasswords(p => ({ ...p, confirm: v }))} placeholder="Повторите новый пароль" type="password" />
            </div>
            <button className="px-5 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink-light transition-colors">
              Обновить пароль
            </button>
          </div>
        )}
      </div>

      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
            <Icon name="CreditCard" size={18} className="text-ink-muted" />
          </div>
          <div>
            <h3 className="font-semibold">Тариф</h3>
            <p className="text-xs text-ink-faint">Выберите подходящий план</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TARIFFS.map(t => (
            <div key={t.id}
              className={`relative rounded-xl border-2 p-5 transition-all cursor-pointer hover:shadow-md ${t.current ? "border-ink bg-ink/[0.02]" : "border-snow-dark hover:border-ink-faint"}`}>
              {t.current && (
                <span className="absolute -top-2.5 left-4 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Текущий
                </span>
              )}
              <h4 className="font-semibold text-sm mb-1">{t.name}</h4>
              <p className="text-lg font-bold mb-3">{t.price}</p>
              <ul className="space-y-1.5">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Icon name="Check" size={12} className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {!t.current && (
                <button className="w-full mt-4 py-2 rounded-lg border border-ink text-ink text-xs font-medium hover:bg-ink hover:text-white transition-colors">
                  Выбрать
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder, type = "text" }: {
  label: string; icon: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-ink-muted font-medium mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-ink/10 focus-within:border-ink/30 transition-all">
        <Icon name={icon} size={15} className="text-ink-faint shrink-0" />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder:text-ink-faint/50 focus:outline-none" />
      </div>
    </div>
  );
}