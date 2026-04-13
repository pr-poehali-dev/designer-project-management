import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

const CATEGORIES = [
  { id: "", label: "Все" },
  { id: "shop", label: "Магазин" },
  { id: "supplier", label: "Поставщик" },
  { id: "contractor", label: "Отделочник" },
  { id: "other", label: "Другое" },
];

const CATEGORY_COLORS: Record<string, string> = {
  shop: "bg-blue-50 text-blue-600",
  supplier: "bg-amber-50 text-amber-700",
  contractor: "bg-green-50 text-green-700",
  other: "bg-snow-mid text-ink-muted",
};

interface Partner {
  id: number;
  name: string;
  category: string;
  services: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  contact_person: string;
  discount_percent: number;
  notes: string;
}

const EMPTY: Omit<Partner, "id"> = {
  name: "", category: "shop", services: "", phone: "", email: "",
  address: "", website: "", contact_person: "", discount_percent: 0, notes: "",
};

function PartnerModal({ partner, onClose, onSaved }: {
  partner: Partner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Partner, "id">>(partner ? { ...partner } : { ...EMPTY });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = partner
      ? `${API}?action=partners&id=${partner.id}`
      : `${API}?action=partners`;
    await fetch(url, {
      method: partner ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  const set = (k: keyof typeof form, v: string | number) =>
    setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark sticky top-0 bg-white">
          <h2 className="font-semibold text-ink">{partner ? "Редактировать партнёра" : "Новый партнёр"}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Название *</label>
              <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                placeholder="ООО Интерьер Плюс" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Тип</label>
              <select className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white transition-colors"
                value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.filter(c => c.id).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Скидка %</label>
              <input type="number" min={0} max={100} className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                placeholder="0" value={form.discount_percent} onChange={e => set("discount_percent", Number(e.target.value))} />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Услуги / товары</label>
              <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                placeholder="Мебель, напольные покрытия, светильники" value={form.services} onChange={e => set("services", e.target.value)} />
            </div>
          </div>

          <div className="border-t border-snow-dark pt-4">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Контакты</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Контактное лицо</label>
                <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                  placeholder="Иванов Иван" value={form.contact_person} onChange={e => set("contact_person", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Телефон</label>
                <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                  placeholder="+7 (999) 123-45-67" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
                <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                  placeholder="info@company.ru" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Сайт</label>
                <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                  placeholder="company.ru" value={form.website} onChange={e => set("website", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Адрес</label>
                <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                  placeholder="г. Москва, ул. Ленина, 1" value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-snow-dark pt-4">
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Примечание</label>
            <textarea className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors resize-none"
              rows={3} placeholder="Дополнительная информация..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-snow-dark sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 h-10 border border-snow-dark rounded-xl text-sm text-ink-muted hover:bg-snow transition-colors">
            Отмена
          </button>
          <button onClick={save} disabled={!form.name.trim() || saving}
            className="flex-1 h-10 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-40">
            {saving ? "Сохраняю..." : partner ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner, onEdit, onDelete }: {
  partner: Partner;
  onEdit: (p: Partner) => void;
  onDelete: (id: number) => void;
}) {
  const catLabel = CATEGORIES.find(c => c.id === partner.category)?.label || partner.category;
  const catColor = CATEGORY_COLORS[partner.category] || CATEGORY_COLORS.other;

  return (
    <div className="bg-white border border-snow-dark rounded-2xl p-5 hover:shadow-md transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink text-base leading-tight truncate">{partner.name}</h3>
          {partner.contact_person && (
            <p className="text-xs text-ink-faint mt-0.5">{partner.contact_person}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(partner)} className="w-7 h-7 rounded-lg hover:bg-snow flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
            <Icon name="Pencil" size={13} />
          </button>
          <button onClick={() => onDelete(partner.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-ink-faint hover:text-red-500 transition-colors">
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
        {partner.discount_percent > 0 && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-0.5">
            <Icon name="Tag" size={10} /> {partner.discount_percent}% скидка
          </span>
        )}
      </div>

      {partner.services && (
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{partner.services}</p>
      )}

      <div className="flex flex-col gap-1 pt-2 border-t border-snow">
        {partner.phone && (
          <a href={`tel:${partner.phone}`} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors">
            <Icon name="Phone" size={11} /> {partner.phone}
          </a>
        )}
        {partner.email && (
          <a href={`mailto:${partner.email}`} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors truncate">
            <Icon name="Mail" size={11} /> {partner.email}
          </a>
        )}
        {partner.website && (
          <a href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors truncate">
            <Icon name="Globe" size={11} /> {partner.website}
          </a>
        )}
        {partner.address && (
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Icon name="MapPin" size={11} /> {partner.address}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [modalPartner, setModalPartner] = useState<Partner | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}?action=partners`);
    const data = await r.json();
    if (data.ok) setPartners(data.partners || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deletePartner = async (id: number) => {
    if (!confirm("Удалить партнёра?")) return;
    await fetch(`${API}?action=partners&id=${id}`, { method: "DELETE" });
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const filtered = partners.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.services.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Партнёры</h1>
          <p className="text-xs text-ink-faint mt-0.5">Магазины, поставщики, отделочники</p>
        </div>
        <button onClick={() => setModalPartner("new")}
          className="flex items-center gap-2 h-9 px-4 bg-ink text-white text-sm rounded-full hover:bg-ink-light transition-colors">
          <Icon name="Plus" size={14} /> Добавить партнёра
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="h-8 pl-7 pr-3 text-xs rounded-lg border border-snow-dark outline-none focus:border-ink transition-colors bg-white"
            placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCategory(c.id)}
              className={`h-8 px-3 rounded-lg border text-xs transition-all ${
                filterCategory === c.id
                  ? "border-ink bg-ink text-white font-medium"
                  : "border-snow-dark text-ink-muted hover:border-ink-faint"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        {filtered.length !== partners.length && (
          <span className="text-xs text-ink-faint">{filtered.length} из {partners.length}</span>
        )}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-snow flex items-center justify-center mx-auto mb-3">
            <Icon name="Handshake" size={24} className="text-ink-faint" />
          </div>
          <p className="text-sm font-medium text-ink-muted">
            {partners.length === 0 ? "Партнёров пока нет" : "Ничего не найдено"}
          </p>
          {partners.length === 0 && (
            <button onClick={() => setModalPartner("new")}
              className="mt-3 text-sm text-ink font-medium hover:underline">
              Добавить первого партнёра
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <PartnerCard key={p.id} partner={p}
              onEdit={setModalPartner}
              onDelete={deletePartner} />
          ))}
        </div>
      )}

      {modalPartner !== null && (
        <PartnerModal
          partner={modalPartner === "new" ? null : modalPartner}
          onClose={() => setModalPartner(null)}
          onSaved={() => { setModalPartner(null); load(); }}
        />
      )}
    </div>
  );
}
