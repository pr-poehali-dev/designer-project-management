import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_API, SESSION_KEY, Session } from "./ClientPortalTypes";

interface Props { projectToken: string; onAuth: (s: Session) => void; }

export default function ClientLoginScreen({ projectToken, onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) { setError("Пароли не совпадают"); return; }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      const b: Record<string, string> = { project_token: projectToken, email, password };
      if (mode === "register" && name) b.name = name;
      const r = await fetch(`${AUTH_API}?action=${mode === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error || "Ошибка"); return; }
      const s: Session = { token: data.token, name: data.name, client_id: data.client_id };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      onAuth(s);
    } catch { setError("Ошибка сети"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <Icon name="Building2" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-sm text-gray-500 mt-1">Войдите или создайте аккаунт</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Ваше имя</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Повторите пароль</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gray-900 text-white font-medium text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
