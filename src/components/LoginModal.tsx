import { useState } from "react";
import Icon from "@/components/ui/icon";
import { loginDesigner, registerDesigner } from "@/lib/designerAuth";

interface Props {
  onLogin: () => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (!name.trim()) { setError("Введите ваше имя"); return; }
      if (password !== confirm) { setError("Пароли не совпадают"); return; }
    }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        await loginDesigner(email, password);
      } else {
        await registerDesigner(email, password, name.trim());
      }
      onLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-10 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        <button onClick={onClose} className="absolute top-5 right-5 text-ink-faint hover:text-ink transition-colors">
          <Icon name="X" size={18} />
        </button>

        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Войти" : "Регистрация"}
          </h2>
          <p className="text-ink-muted text-sm mt-2">
            {mode === "login" ? "Войдите в свой кабинет дизайнера" : "Создайте аккаунт дизайнера"}
          </p>
        </div>

        <div className="flex rounded-xl bg-snow p-1 mb-6">
          {(["login", "register"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? "bg-white shadow text-ink" : "text-ink-muted"}`}>
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs text-ink-muted font-medium mb-2 block">Ваше имя</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full bg-snow border border-snow-dark rounded-xl px-4 py-3 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:border-ink-faint transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-ink-muted font-medium mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              required
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
              required
              className="w-full bg-snow border border-snow-dark rounded-xl px-4 py-3 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:border-ink-faint transition-colors"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="text-xs text-ink-muted font-medium mb-2 block">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-snow border border-snow-dark rounded-xl px-4 py-3 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:border-ink-faint transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Icon name="AlertCircle" size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-12 bg-ink text-white font-medium text-sm rounded-xl hover:bg-ink-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
