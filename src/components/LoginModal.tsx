import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: () => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-10 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ink-faint hover:text-ink transition-colors"
        >
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
              onChange={e => setEmail(e.target.value)}
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
          <button
            type="submit"
            className="w-full h-12 bg-ink text-white font-medium text-sm rounded-xl hover:bg-ink-light transition-colors"
          >
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
