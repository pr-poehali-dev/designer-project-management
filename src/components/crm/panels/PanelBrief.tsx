import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Brief } from "../ProjectCardTypes";

const BRIEF_STATUS_OPTIONS = [
  { id: "draft",  label: "Ожидает отправки", color: "text-ink-faint bg-snow-mid" },
  { id: "sent",   label: "Отправлен клиенту", color: "text-blue-600 bg-blue-50" },
  { id: "filled", label: "Заполнен",          color: "text-green-600 bg-green-50" },
];

interface Props {
  brief: Brief;
  briefSaved: Brief;
  briefLoaded: boolean;
  setBrief: (fn: (p: Brief) => Brief) => void;
  onSave: () => Promise<void>;
  clientLink: string;
  onGetClientLink: () => Promise<string>;
  onSendToChat: (text: string) => Promise<void>;
}

const FIELDS: { key: keyof Brief; label: string; long?: boolean }[] = [
  { key: "style",         label: "Стиль интерьера" },
  { key: "area",          label: "Площадь, м²" },
  { key: "budget",        label: "Бюджет" },
  { key: "rooms",         label: "Помещения (комнаты)" },
  { key: "color_palette", label: "Цветовая палитра",        long: true },
  { key: "furniture",     label: "Предпочтения по мебели",   long: true },
  { key: "wishes",        label: "Пожелания",                long: true },
  { key: "restrictions",  label: "Ограничения",              long: true },
  { key: "extra",         label: "Дополнительно",            long: true },
  { key: "client_comment",label: "Комментарий клиента",      long: true },
];

const inputCls = "w-full border border-snow-dark rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors bg-white";

function buildBriefText(brief: Brief): string {
  const lines: string[] = ["📋 БРИФ НА ДИЗАЙН-ПРОЕКТ\n"];
  const map: [keyof Brief, string][] = [
    ["style",          "Стиль"],
    ["area",           "Площадь"],
    ["budget",         "Бюджет"],
    ["rooms",          "Помещения"],
    ["color_palette",  "Цветовая палитра"],
    ["furniture",      "Мебель"],
    ["wishes",         "Пожелания"],
    ["restrictions",   "Ограничения"],
    ["extra",          "Дополнительно"],
  ];
  for (const [key, label] of map) {
    const val = brief[key] as string;
    if (val) lines.push(`${label}: ${val}`);
  }
  return lines.join("\n");
}

export default function PanelBrief({
  brief, briefSaved, briefLoaded, setBrief, onSave,
  clientLink, onGetClientLink, onSendToChat,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "error">("idle");
  const [downloading, setDownloading] = useState(false);

  const hasChanges = JSON.stringify(brief) !== JSON.stringify(briefSaved);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSend = async () => {
    setSending(true);
    setSendStatus("idle");
    try {
      // Сохраняем бриф и меняем статус на sent
      setBrief(p => ({ ...p, status: "sent" }));
      await onSave();

      // Получаем ссылку клиента
      const link = clientLink || await onGetClientLink();

      // Формируем сообщение
      const text = `Добрый день! Пожалуйста, заполните бриф для вашего проекта.\n\nВы можете войти в личный кабинет по ссылке:\n${link}\n\nТам вы найдёте бриф, референсы и все материалы по проекту.`;
      await onSendToChat(text);
      setSendStatus("ok");
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch {
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const lines: string[] = [
        "БРИФ НА ДИЗАЙН-ПРОЕКТ",
        "=".repeat(40),
        "",
      ];
      const map: [keyof Brief, string][] = [
        ["style",          "Стиль интерьера"],
        ["area",           "Площадь, м²"],
        ["budget",         "Бюджет"],
        ["rooms",          "Помещения"],
        ["color_palette",  "Цветовая палитра"],
        ["furniture",      "Предпочтения по мебели"],
        ["wishes",         "Пожелания"],
        ["restrictions",   "Ограничения"],
        ["extra",          "Дополнительно"],
        ["client_comment", "Комментарий клиента"],
      ];
      for (const [key, label] of map) {
        const val = brief[key] as string;
        lines.push(`${label}:`);
        lines.push(val || "—");
        lines.push("");
      }

      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "бриф.txt";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (!briefLoaded) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Действия ── */}
      <div className="flex gap-2 flex-wrap p-4 bg-snow rounded-2xl border border-snow-dark">
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 h-10 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icon name="Send" size={15} />}
          Отправить клиенту
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="h-10 px-4 border border-snow-dark text-sm text-ink-muted font-medium rounded-xl hover:bg-snow-mid transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          <Icon name="Download" size={15} />
          Скачать
        </button>
        {sendStatus === "ok" && (
          <div className="w-full flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Icon name="CheckCircle" size={13} /> Ссылка отправлена клиенту в чат
          </div>
        )}
        {sendStatus === "error" && (
          <div className="w-full flex items-center gap-1.5 text-xs text-red-500">
            <Icon name="AlertCircle" size={13} /> Ошибка отправки
          </div>
        )}
      </div>

      {/* ── Статус ── */}
      <div>
        <p className="text-xs font-medium text-ink-muted mb-2">Статус брифа</p>
        <div className="flex gap-2 flex-wrap">
          {BRIEF_STATUS_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setBrief(p => ({ ...p, status: s.id }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                brief.status === s.id
                  ? `${s.color} border-current`
                  : "border-transparent bg-snow text-ink-muted hover:border-snow-dark"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Поля брифа ── */}
      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="block text-xs font-medium text-ink-muted mb-1">{f.label}</label>
          {f.long ? (
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={(brief[f.key] as string) || ""}
              onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))}
            />
          ) : (
            <input
              className={inputCls}
              value={(brief[f.key] as string) || ""}
              onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}

      {/* ── Сохранить ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`h-10 px-6 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            hasChanges
              ? "bg-ink text-white hover:bg-ink-light"
              : "bg-snow text-ink-faint cursor-not-allowed"
          }`}
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icon name="Save" size={15} />}
          Сохранить
        </button>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Icon name="Check" size={13} /> Сохранено
          </span>
        )}
      </div>
    </div>
  );
}
