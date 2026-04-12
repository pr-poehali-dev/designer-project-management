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
      <div className="absolute inset-0 bg-onyx/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-sm p-10 w-full max-w-md mx-4 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground transition-colors"
        >
          <Icon name="X" size={18} />
        </button>

        <div className="mb-8">
          <p className="font-cormorant text-gold text-sm tracking-[0.3em] uppercase mb-2">АРЕНА</p>
          <h2 className="font-cormorant text-3xl font-light">Добро пожаловать</h2>
          <p className="text-foreground/40 text-sm mt-2">Войдите, чтобы открыть платформу</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-foreground/50 tracking-wide mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-onyx-mid border border-onyx-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-foreground/50 tracking-wide mb-2 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-onyx-mid border border-onyx-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-gold text-onyx font-semibold text-sm tracking-wide mt-2 hover:bg-gold-light transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,168,76,0.3)]"
          >
            Войти
          </button>
        </form>
        <p className="text-center text-foreground/30 text-xs mt-6">
          Нет аккаунта?{" "}
          <span className="text-gold cursor-pointer hover:text-gold-light transition-colors">Запросить доступ</span>
        </p>
      </div>
    </div>
  );
}
