import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

const SPECIALIZATIONS = [
  { id: "designer", label: "Дизайнер", icon: "Palette" },
  { id: "draftsman", label: "Чертежник", icon: "PenTool" },
  { id: "visualizer", label: "Визуализатор", icon: "Monitor" },
  { id: "estimator", label: "Сметчик", icon: "Calculator" },
];

interface GuildProfile {
  specializations: string[];
  guild_description: string;
  guild_price_info: string;
  guild_photos: string[];
  taking_orders: boolean;
}

const EMPTY: GuildProfile = {
  specializations: [],
  guild_description: "",
  guild_price_info: "",
  guild_photos: [],
  taking_orders: false,
};

export default function GuildProfileBlock() {
  const [profile, setProfile] = useState<GuildProfile>({ ...EMPTY });
  const [saved, setSaved] = useState<GuildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=guild_profile`);
      const data = await r.json();
      if (data.ok) {
        const g = { ...EMPTY, ...data.guild };
        setProfile(g);
        setSaved({ ...g });
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${API}?action=guild_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await r.json();
      if (data.ok) {
        setSaved({ ...profile });
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else { setStatus("error"); }
    } catch { setStatus("error"); } finally { setSaving(false); }
  };

  const toggleSpec = (id: string) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.includes(id)
        ? prev.specializations.filter(s => s !== id)
        : [...prev.specializations, id],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (profile.guild_photos.length >= 10) {
      alert("Максимум 10 фотографий");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 10 МБ.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const r = await fetch(`${API}?action=upload_guild_photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, mime: file.type }),
        });
        const data = await r.json();
        if (data.ok && data.url) {
          setProfile(prev => ({ ...prev, guild_photos: [...prev.guild_photos, data.url] }));
          setSaved(prev => prev ? { ...prev, guild_photos: [...prev.guild_photos, data.url] } : prev);
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploadingPhoto(false); }
    e.target.value = "";
  };

  const deletePhoto = async (url: string) => {
    setProfile(prev => ({ ...prev, guild_photos: prev.guild_photos.filter(p => p !== url) }));
    setSaved(prev => prev ? { ...prev, guild_photos: prev.guild_photos.filter(p => p !== url) } : prev);
    await fetch(`${API}?action=delete_guild_photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {/* ignore */});
  };

  const hasChanges = saved && JSON.stringify(profile) !== JSON.stringify(saved);

  if (loading) return null;

  return (
    <div className="card-surface rounded-2xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center">
            <Icon name="Users" size={18} className="text-ink-muted" />
          </div>
          <div>
            <h3 className="font-semibold">Профиль в Гильдии</h3>
            <p className="text-xs text-ink-faint">Отображается другим пользователям для поиска исполнителей</p>
          </div>
        </div>

        <button
          onClick={async () => {
            const newVal = !profile.taking_orders;
            setProfile(prev => ({ ...prev, taking_orders: newVal }));
            setSaved(prev => prev ? { ...prev, taking_orders: newVal } : prev);
            await fetch(`${API}?action=guild_profile`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...profile, taking_orders: newVal }),
            }).catch(() => {/* ignore */});
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            profile.taking_orders
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-snow border border-snow-dark text-ink-muted hover:text-ink"
          }`}
        >
          <Icon name={profile.taking_orders ? "CheckCircle" : "Circle"} size={16} />
          {profile.taking_orders ? "Беру заказы" : "Не беру заказы"}
        </button>
      </div>

      <div>
        <p className="text-xs text-ink-muted font-medium mb-3">Специализация (можно выбрать несколько)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SPECIALIZATIONS.map(spec => {
            const active = profile.specializations.includes(spec.id);
            return (
              <button
                key={spec.id}
                onClick={() => toggleSpec(spec.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-snow-dark bg-snow text-ink-muted hover:border-ink/30 hover:text-ink"
                }`}
              >
                <Icon name={spec.icon} size={20} />
                <span className="text-xs font-medium">{spec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs text-ink-muted font-medium mb-1.5 block">Описание выполняемых работ</label>
        <textarea
          value={profile.guild_description}
          onChange={e => setProfile(prev => ({ ...prev, guild_description: e.target.value }))}
          placeholder="Расскажите о своём опыте, стиле работы, специализации..."
          rows={4}
          className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-ink-muted font-medium mb-1.5 block">Цены и условия</label>
        <textarea
          value={profile.guild_price_info}
          onChange={e => setProfile(prev => ({ ...prev, guild_price_info: e.target.value }))}
          placeholder="Например: дизайн-проект от 3000 руб/м², чертежи от 500 руб/лист..."
          rows={3}
          className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-ink-muted font-medium">
            Портфолио ({profile.guild_photos.length}/10)
          </label>
          {profile.guild_photos.length < 10 && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
            >
              {uploadingPhoto
                ? <div className="w-3 h-3 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                : <Icon name="Plus" size={14} />
              }
              Добавить фото
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {profile.guild_photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-snow-dark">
              <img src={url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => deletePhoto(url)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="Trash2" size={16} className="text-white" />
              </button>
            </div>
          ))}
          {profile.guild_photos.length === 0 && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="aspect-square rounded-xl border-2 border-dashed border-snow-dark flex flex-col items-center justify-center gap-2 text-ink-faint hover:border-ink/30 hover:text-ink-muted transition-all disabled:opacity-40"
            >
              <Icon name="ImagePlus" size={20} />
              <span className="text-[10px]">Добавить</span>
            </button>
          )}
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-snow-dark">
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
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"
          }`}
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={16} />}
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
