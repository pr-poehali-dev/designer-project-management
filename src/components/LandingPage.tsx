import { useState } from "react";
import Icon from "@/components/ui/icon";
import LoginModal from "@/components/LoginModal";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/9603c9de-6ac8-4db7-ab98-e327eac054fb/files/7b7f2936-2d05-4808-b52d-5ed1d9b5bb16.jpg";

interface Props {
  onLogin: () => void;
}

const services = [
  { icon: "Layers", title: "Брендинг", desc: "Айдентика, логотипы, гайдлайны и фирменный стиль" },
  { icon: "Monitor", title: "UI/UX", desc: "Интерфейсы сайтов, приложений и SaaS-платформ" },
  { icon: "Palette", title: "Графика", desc: "Печатная продукция, упаковка и иллюстрации" },
  { icon: "Video", title: "Моушн", desc: "Промо-ролики, анимация логотипов, reels" },
];

const works = [
  { title: "Luxuria Hotels", cat: "Брендинг" },
  { title: "Fintech Dashboard", cat: "UI/UX" },
  { title: "Nova Packaging", cat: "Графика" },
  { title: "Atlas Identity", cat: "Брендинг" },
  { title: "Echo Platform", cat: "UI/UX" },
  { title: "Orbis Motion Kit", cat: "Моушн" },
];

export default function LandingPage({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-white text-ink font-body">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-snow-dark">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="font-display text-lg font-bold tracking-tight">Арена</span>
          <div className="hidden md:flex items-center gap-8">
            {["Услуги", "Работы", "О нас", "Контакты"].map(item => (
              <a key={item} href="#" className="nav-link relative text-sm text-ink-muted hover:text-ink transition-colors">
                {item}
              </a>
            ))}
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors"
          >
            Войти
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-sm text-ink-faint font-medium tracking-widest uppercase mb-6 animate-fade-in stagger-1">
              Дизайн-студия · Москва
            </p>
            <h1 className="font-display text-[64px] md:text-[88px] leading-[0.95] font-light tracking-tight mb-8 animate-fade-in stagger-2">
              Дизайн,<br />
              который<br />
              <span className="font-semibold">запоминают</span>
            </h1>
            <p className="text-ink-muted text-lg leading-relaxed max-w-md mb-12 animate-fade-in stagger-3">
              Превращаем сложные идеи в визуальные решения, которые работают на бизнес
            </p>
            <div className="flex items-center gap-4 animate-fade-in stagger-4">
              <button className="h-12 px-8 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors">
                Обсудить проект
              </button>
              <button className="h-12 px-8 border border-snow-dark text-ink text-sm font-medium rounded-full hover:border-ink-faint transition-colors">
                Портфолио
              </button>
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-20 rounded-2xl overflow-hidden animate-fade-in stagger-5">
            <img src={HERO_IMAGE} alt="Studio" className="w-full h-[400px] object-cover grayscale hover:grayscale-0 transition-all duration-700" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-snow-dark">
            {[["7+", "лет опыта"], ["120+", "проектов"], ["40+", "клиентов"], ["18", "наград"]].map(([num, label]) => (
              <div key={label}>
                <div className="font-display text-4xl font-light">{num}</div>
                <div className="text-sm text-ink-faint mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 px-6 bg-snow">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-sm text-ink-faint font-medium tracking-widest uppercase mb-3">Услуги</p>
            <h2 className="font-display text-4xl font-light tracking-tight">Чем мы занимаемся</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map(s => (
              <div key={s.title} className="card-surface rounded-2xl p-7 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-snow-mid flex items-center justify-center mb-5 group-hover:bg-ink group-hover:text-white transition-all">
                  <Icon name={s.icon} fallback="Star" size={18} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-sm text-ink-faint font-medium tracking-widest uppercase mb-3">Портфолио</p>
              <h2 className="font-display text-4xl font-light tracking-tight">Избранные работы</h2>
            </div>
            <button className="text-sm text-ink-muted hover:text-ink transition-colors flex items-center gap-1">
              Все работы <Icon name="ArrowRight" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {works.map((w, i) => (
              <div key={w.title} className="group cursor-pointer">
                <div className="aspect-[4/3] bg-snow rounded-2xl mb-4 overflow-hidden flex items-center justify-center border border-snow-dark group-hover:border-ink-faint/30 transition-all">
                  <span className="font-display text-6xl font-extralight text-snow-dark group-hover:text-ink-faint transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display font-semibold">{w.title}</h3>
                <p className="text-sm text-ink-faint">{w.cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-24 px-6 bg-snow">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-sm text-ink-faint font-medium tracking-widest uppercase mb-6">О нас</p>
            <h2 className="font-display text-4xl font-light tracking-tight mb-8">
              Дизайн с характером,<br />не шаблоном
            </h2>
            <p className="text-ink-muted leading-relaxed mb-6">
              Работаем на стыке стратегии и визуала. Каждый проект начинается с глубокого понимания бизнеса — только потом рождается дизайн.
            </p>
            <p className="text-ink-muted leading-relaxed">
              За 7 лет мы помогли брендам от стартапов до международных компаний найти свой язык и говорить на нём уверенно.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { skill: "Брендинг & Айдентика", pct: 95 },
              { skill: "UI/UX Дизайн", pct: 90 },
              { skill: "Моушн-дизайн", pct: 75 },
              { skill: "Стратегия бренда", pct: 85 },
            ].map(({ skill, pct }) => (
              <div key={skill}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink-light">{skill}</span>
                  <span className="text-ink-faint">{pct}%</span>
                </div>
                <div className="h-1 bg-snow-dark rounded-full overflow-hidden">
                  <div className="h-full progress-bar" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-ink-faint font-medium tracking-widest uppercase mb-4">Начнём?</p>
          <h2 className="font-display text-5xl font-light tracking-tight mb-6">
            Есть проект? Давайте поговорим.
          </h2>
          <p className="text-ink-muted mb-10">
            Отвечаем в течение 24 часов. Первая консультация — бесплатно.
          </p>
          <button className="h-14 px-12 bg-ink text-white text-sm font-semibold tracking-wide rounded-full hover:bg-ink-light transition-colors">
            Написать нам
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-snow-dark py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-ink-faint">
          <span className="font-display font-bold text-ink">Арена</span>
          <span>© 2024</span>
          <div className="flex gap-5">
            {["Telegram", "Behance", "Instagram"].map(s => (
              <a key={s} href="#" className="hover:text-ink transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </footer>

      {showLogin && <LoginModal onLogin={onLogin} onClose={() => setShowLogin(false)} />}
    </div>
  );
}
