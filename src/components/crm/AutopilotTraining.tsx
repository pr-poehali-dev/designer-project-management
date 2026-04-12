import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { AVITO_API } from "./chats.types";

const PLACEHOLDER = `Пример:
Ты — менеджер компании «МойБизнес», тебя зовут Анна.
Мы занимаемся ремонтом квартир в Москве.

Услуги и цены:
- Косметический ремонт: от 3000 руб/м²
- Капитальный ремонт: от 5500 руб/м²
- Дизайн-проект: от 1500 руб/м²

Правила общения:
1. Отвечай вежливо и коротко (2-3 предложения)
2. Всегда проси номер телефона клиента
3. Если спрашивают о сроках — говори что зависит от объёма
4. Никогда не говори что ты бот или ИИ`;

export default function AutopilotTraining() {
  const [prompt, setPrompt] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const loadPrompt = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${AVITO_API}?action=prompt`);
      const data = await r.json();
      if (data.ok) {
        setPrompt(data.prompt || "");
        setSaved(data.prompt || "");
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrompt(); }, [loadPrompt]);

  const savePrompt = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${AVITO_API}?action=prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      if (data.ok) {
        setSaved(prompt);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = prompt !== saved;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center">
            <Icon name="GraduationCap" size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Обучение автоответа</h2>
            <p className="text-xs text-ink-faint">Опишите информацию о вашей компании — автопилот будет использовать её при ответах</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-snow/50 border border-snow-dark rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <Icon name="Lightbulb" size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-ink-muted leading-relaxed">
                Напишите сюда всё, что автоответчик должен знать: название компании, услуги, цены, как себя вести, 
                как представляться. Чем подробнее — тем лучше будут ответы клиентам.
              </p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={PLACEHOLDER}
              className="w-full h-80 bg-white border border-snow-dark rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 placeholder:text-ink-faint/50 transition-all"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-ink-faint">
              {prompt.length} символов
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === "saved" && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Icon name="Check" size={14} />
                  Сохранено
                </span>
              )}
              {status === "error" && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <Icon name="AlertCircle" size={14} />
                  Ошибка сохранения
                </span>
              )}
              {!prompt.trim() && status === "idle" && (
                <span className="text-xs text-ink-faint">
                  Пока пусто — автопилот использует стандартный шаблон
                </span>
              )}
            </div>

            <button
              onClick={savePrompt}
              disabled={saving || !hasChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                hasChanges
                  ? "bg-ink text-white hover:bg-ink-light"
                  : "bg-snow text-ink-faint cursor-not-allowed"
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="Save" size={16} />
              )}
              {saving ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
