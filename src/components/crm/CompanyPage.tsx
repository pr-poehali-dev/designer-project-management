import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import GuildProfileBlock from "@/components/crm/GuildProfileBlock";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

interface Company {
  legal_form: string;
  company_name: string;
  inn: string;
  ogrn: string;
  kpp: string;
  legal_address: string;
  actual_address: string;
  bank_name: string;
  bik: string;
  checking_account: string;
  corr_account: string;
  director_name: string;
  contact_phone: string;
  contact_email: string;
  logo_url?: string;
}

const EMPTY: Company = {
  legal_form: "self_employed", company_name: "", inn: "", ogrn: "", kpp: "",
  legal_address: "", actual_address: "",
  bank_name: "", bik: "", checking_account: "", corr_account: "",
  director_name: "", contact_phone: "", contact_email: "", logo_url: "",
};

const LEGAL_FORMS = [
  { id: "self_employed", label: "Самозанятый", icon: "User", desc: "Физлицо, налог на профдоход" },
  { id: "ip", label: "ИП", icon: "UserCheck", desc: "Индивидуальный предприниматель" },
  { id: "ooo", label: "ООО", icon: "Building2", desc: "Общество с ограниченной ответственностью" },
];

export default function CompanyPage() {
  const [company, setCompany] = useState<Company>({ ...EMPTY });
  const [saved, setSaved] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=company`);
      const data = await r.json();
      if (data.ok) {
        const c = { ...EMPTY, ...data.company };
        setCompany(c);
        setSaved({ ...c });
        if (data.company.logo_url) setLogoPreview(data.company.logo_url);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCompany(); }, [loadCompany]);

  const saveCompany = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${API}?action=company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      const data = await r.json();
      if (data.ok) {
        setSaved({ ...company });
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else { setStatus("error"); }
    } catch { setStatus("error"); } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 5 МБ.");
      return;
    }
    setUploadingLogo(true);
    try {
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const r = await fetch(`${API}?action=upload_logo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, mime: file.type }),
        });
        const data = await r.json();
        if (data.ok) {
          setLogoPreview(data.url);
          setCompany(prev => ({ ...prev, logo_url: data.url }));
          setSaved(prev => prev ? { ...prev, logo_url: data.url } : prev);
        }
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    setLogoPreview("");
    setCompany(prev => ({ ...prev, logo_url: "" }));
    await fetch(`${API}?action=upload_logo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "", mime: "image/png", remove: true }),
    }).catch(() => {/* ignore */});
    await fetch(`${API}?action=company`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: "" }),
    }).catch(() => {/* ignore */});
  };

  const set = (field: keyof Company, value: string) => setCompany(prev => ({ ...prev, [field]: value }));
  const hasChanges = saved && JSON.stringify(company) !== JSON.stringify(saved);
  const isOOO = company.legal_form === "ooo";

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
            <Icon name="Image" size={18} className="text-ink-muted" />
          </div>
          <div>
            <h3 className="font-semibold">Логотип компании</h3>
            <p className="text-xs text-ink-faint">Используется в документах, договорах и КП</p>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${logoPreview ? "border-snow-dark" : "border-snow-dark hover:border-ink-faint"}`}>
              {logoPreview ? (
                <img src={logoPreview} alt="Логотип" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-ink-faint">
                  <Icon name="ImagePlus" size={24} />
                  <span className="text-[10px] text-center leading-tight">PNG, JPG<br />до 5 МБ</span>
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <p className="text-sm text-ink-muted">Рекомендуем PNG с прозрачным фоном, минимум 200×200 px</p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40 flex items-center gap-2">
                <Icon name="Upload" size={14} />
                {logoPreview ? "Заменить" : "Загрузить"}
              </button>
              {logoPreview && (
                <button
                  onClick={removeLogo}
                  className="px-4 py-2 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors text-ink-muted hover:text-red-500 flex items-center gap-2">
                  <Icon name="Trash2" size={14} />
                  Удалить
                </button>
              )}
            </div>
            {logoPreview && !uploadingLogo && (
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <Icon name="Check" size={12} /> Логотип сохранён
              </p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
            <Icon name="Building2" size={18} className="text-ink-muted" />
          </div>
          <div>
            <h3 className="font-semibold">Форма деятельности</h3>
            <p className="text-xs text-ink-faint">Выберите, в какой форме вы работаете</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LEGAL_FORMS.map(f => (
            <button key={f.id} onClick={() => set("legal_form", f.id)}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${company.legal_form === f.id ? "border-ink bg-ink/[0.02]" : "border-snow-dark hover:border-ink-faint"}`}>
              {company.legal_form === f.id && (
                <div className="absolute top-3 right-3">
                  <Icon name="CheckCircle2" size={16} className="text-ink" />
                </div>
              )}
              <div className="w-9 h-9 rounded-lg bg-snow flex items-center justify-center mb-2">
                <Icon name={f.icon} size={16} className="text-ink-muted" />
              </div>
              <h4 className="font-semibold text-sm">{f.label}</h4>
              <p className="text-[11px] text-ink-faint mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
            <Icon name="FileText" size={18} className="text-ink-muted" />
          </div>
          <div>
            <h3 className="font-semibold">Реквизиты</h3>
            <p className="text-xs text-ink-faint">Данные для оформления документов и договоров</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={isOOO ? "Название организации" : "ФИО"} icon="Building" value={company.company_name}
              onChange={v => set("company_name", v)} placeholder={isOOO ? 'ООО "Компания"' : "Иванов Иван Иванович"} />
            <Field label="ИНН" icon="Hash" value={company.inn}
              onChange={v => set("inn", v)} placeholder={isOOO ? "10 цифр" : "12 цифр"} />
          </div>

          {(company.legal_form === "ip" || isOOO) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={isOOO ? "ОГРН" : "ОГРНИП"} icon="Hash" value={company.ogrn}
                onChange={v => set("ogrn", v)} placeholder={isOOO ? "13 цифр" : "15 цифр"} />
              {isOOO && (
                <Field label="КПП" icon="Hash" value={company.kpp}
                  onChange={v => set("kpp", v)} placeholder="9 цифр" />
              )}
            </div>
          )}

          <Field label="Юридический адрес" icon="MapPin" value={company.legal_address}
            onChange={v => set("legal_address", v)} placeholder="г. Москва, ул. Примерная, д. 1" />
          <Field label="Фактический адрес" icon="MapPin" value={company.actual_address}
            onChange={v => set("actual_address", v)} placeholder="Совпадает с юридическим или укажите другой" />

          {isOOO && (
            <Field label="Генеральный директор" icon="User" value={company.director_name}
              onChange={v => set("director_name", v)} placeholder="Иванов Иван Иванович" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Телефон для связи" icon="Phone" value={company.contact_phone}
              onChange={v => set("contact_phone", v)} placeholder="+7 (999) 123-45-67" />
            <Field label="Email для документов" icon="Mail" value={company.contact_email}
              onChange={v => set("contact_email", v)} placeholder="docs@company.ru" />
          </div>
        </div>
      </div>

      {(company.legal_form === "ip" || isOOO) && (
        <div className="card-surface rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
              <Icon name="Landmark" size={18} className="text-ink-muted" />
            </div>
            <div>
              <h3 className="font-semibold">Банковские реквизиты</h3>
              <p className="text-xs text-ink-faint">Для выставления счетов и получения оплаты</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Банк" icon="Landmark" value={company.bank_name}
                onChange={v => set("bank_name", v)} placeholder='ПАО "Сбербанк"' />
              <Field label="БИК" icon="Hash" value={company.bik}
                onChange={v => set("bik", v)} placeholder="9 цифр" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Расчётный счёт" icon="CreditCard" value={company.checking_account}
                onChange={v => set("checking_account", v)} placeholder="20 цифр" />
              <Field label="Корр. счёт" icon="CreditCard" value={company.corr_account}
                onChange={v => set("corr_account", v)} placeholder="20 цифр" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-4">
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
        <button onClick={saveCompany} disabled={saving || !hasChanges}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={16} />}
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>

      <GuildProfileBlock />
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder }: {
  label: string; icon: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs text-ink-muted font-medium mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-ink/10 focus-within:border-ink/30 transition-all">
        <Icon name={icon} size={15} className="text-ink-faint shrink-0" />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder:text-ink-faint/50 focus:outline-none" />
      </div>
    </div>
  );
}