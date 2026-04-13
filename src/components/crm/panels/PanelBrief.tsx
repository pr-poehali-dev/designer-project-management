import Icon from "@/components/ui/icon";
import { Brief } from "../ProjectCardTypes";

const BRIEF_STATUS_OPTIONS = [
  { id: "draft", label: "Ожидает отправки", color: "text-ink-faint bg-snow-mid" },
  { id: "sent", label: "Отправлен клиенту", color: "text-blue-600 bg-blue-50" },
  { id: "filled", label: "Заполнен", color: "text-green-600 bg-green-50" },
];

interface Props {
  brief: Brief;
  briefSaved: Brief;
  briefLoaded: boolean;
  setBrief: (fn: (p: Brief) => Brief) => void;
  onSave: () => Promise<void>;
}

const FIELDS: { key: keyof Brief; label: string; long?: boolean }[] = [
  { key: "style", label: "Стиль интерьера" },
  { key: "area", label: "Площадь, м²" },
  { key: "budget", label: "Бюджет" },
  { key: "rooms", label: "Помещения (комнаты)" },
  { key: "color_palette", label: "Цветовая палитра", long: true },
  { key: "furniture", label: "Предпочтения по мебели", long: true },
  { key: "wishes", label: "Пожелания", long: true },
  { key: "restrictions", label: "Ограничения", long: true },
  { key: "extra", label: "Дополнительно", long: true },
  { key: "client_comment", label: "Комментарий клиента", long: true },
];

const inputCls = "w-full border border-snow-dark rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors bg-white";

export default function PanelBrief({ brief, briefSaved, briefLoaded, setBrief, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = JSON.stringify(brief) !== JSON.stringify(briefSaved);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!briefLoaded) return <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Статус брифа */}
      <div>
        <p className="text-xs font-medium text-ink-muted mb-2">Статус брифа</p>
        <div className="flex gap-2 flex-wrap">
          {BRIEF_STATUS_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setBrief(p => ({ ...p, status: s.id }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                brief.status === s.id
                  ? `${s.color} border-current`
                  : "border-transparent bg-snow text-ink-muted hover:border-snow-dark"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Поля брифа */}
      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="block text-xs font-medium text-ink-muted mb-1">{f.label}</label>
          {f.long ? (
            <textarea className={`${inputCls} resize-none`} rows={3}
              value={(brief[f.key] as string) || ""}
              onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))} />
          ) : (
            <input className={inputCls}
              value={(brief[f.key] as string) || ""}
              onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))} />
          )}
        </div>
      ))}

      {/* Кнопка сохранения */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving || !hasChanges}
          className={`h-10 px-6 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"
          }`}>
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={15} />}
          Сохранить
        </button>
        {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Icon name="Check" size={13} /> Сохранено</span>}
      </div>
    </div>
  );
}

import { useState } from "react";
