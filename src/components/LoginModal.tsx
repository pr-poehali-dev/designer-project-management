import { useState } from "react";
import Icon from "@/components/ui/icon";

const CLIENT_AUTH_API = "https://functions.poehali.dev/6939c14f-545b-476e-9041-fb66c4517ab0";

interface Props {
  onLogin: () => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [clientError, setClientError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");
    if (!email) { onLogin(); return; }

    setChecking(true);
    try {
      const r = await fetch(`${CLIENT_AUTH_API}?action=check_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (data.is_client) {
        setClientError(data.error);
        setChecking(false);
        return;
      }
    } catch { /* ignore, разрешаем войти */ } finally {
      setChecking(false);
    }
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-10 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        <button onClick={onClose} className="absolute top-5 right-5 text-ink-faint hover:text-ink transition-colors">
          <Icon name="X" size={18} />
        </button>

        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Войти</h2>
          <p className="text-ink-muted text-sm mt-2">Войдите, чтобы открыть платформу</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-ink-muted font-medium mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setClientError(""); }}
              placeholder="your@email.com"
              className="w-full bg-snow border border-snow-dark rounded-xl px-4 py-3 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:border-ink-faint transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted font-medium mb-2 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-snow border border-snow-dark rounded-xl px-4 py-3 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:border-ink-faint transition-colors"
            />
          </div>

          {clientError && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Icon name="AlertTriangle" size={15} className="shrink-0 mt-0.5" />
              <span>{clientError}</span>
            </div>
          )}

          <button type="submit" disabled={checking}
            className="w-full h-12 bg-ink text-white font-medium text-sm rounded-xl hover:bg-ink-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {checking && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Войти
          </button>
        </form>
        <p className="text-center text-ink-faint text-xs mt-6">
          Нет аккаунта?{" "}
          <span className="text-ink cursor-pointer font-medium hover:underline">Запросить доступ</span>
        </p>
      </div>
    </div>
  );
}
