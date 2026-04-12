import { useState } from "react";
import Icon from "@/components/ui/icon";
import LoginModal from "@/components/LoginModal";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/9603c9de-6ac8-4db7-ab98-e327eac054fb/files/7b7f2936-2d05-4808-b52d-5ed1d9b5bb16.jpg";

interface Props {
  onLogin: () => void;
}

const services = [
  { icon: "Layers", title: "Брендинг", desc: "Фирменный стиль, логотип, гайдлайны" },
  { icon: "Monitor", title: "UI/UX Дизайн", desc: "Сайты, мобильные приложения, SaaS" },
  { icon: "Palette", title: "Графика", desc: "Печать, упаковка, иллюстрации" },
  { icon: "Video", title: "Моушн", desc: "Анимации, промо-ролики, reels" },
];

const works = [
  { title: "Rebrand Luxuria", cat: "Брендинг", year: "2024" },
  { title: "Fintech App", cat: "UI/UX", year: "2024" },
  { title: "Nova Package", cat: "Графика", year: "2023" },
  { title: "Atlas Motion", cat: "Моушн", year: "2023" },
  { title: "Studio Carte", cat: "Брендинг", year: "2023" },
  { title: "Echo Platform", cat: "UI/UX", year: "2022" },
];

export default function LandingPage({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-onyx text-foreground font-plex overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb w-[600px] h-[600px] bg-gold/8 top-[-200px] right-[-100px]" />
        <div className="orb w-[400px] h-[400px] bg-gold/5 bottom-[20%] left-[-150px]" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(13,13,15,0.95), transparent)' }}>
        <div className="font-cormorant text-2xl font-semibold tracking-widest text-gold">
          АРЕНА
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Услуги', 'Работы', 'О себе', 'Контакты'].map(item => (
            <a key={item} href="#" className="nav-link-gold text-sm text-foreground/70 hover:text-foreground transition-colors">
              {item}
            </a>
          ))}
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2 px-5 py-2 border border-gold/40 text-gold text-sm font-medium rounded-sm hover:bg-gold hover:text-onyx transition-all duration-300"
        >
          <Icon name="LogIn" size={14} />
          Войти
        </button>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="Studio" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0D0D0F 40%, transparent 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0D0D0F 10%, transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20">
          <div className="max-w-3xl">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-6 animate-fade-in stagger-1">
              Дизайн-студия · Москва
            </p>
            <h1 className="font-cormorant text-[80px] md:text-[110px] leading-[0.9] font-light mb-8 animate-fade-in stagger-2">
              Дизайн,<br />
              <em className="text-shimmer not-italic">который</em><br />
              запоминают
            </h1>
            <p className="text-foreground/60 text-lg font-light max-w-md mb-12 animate-fade-in stagger-3">
              Превращаю сложные идеи в визуальные решения, которые работают на бизнес и остаются в памяти
            </p>
            <div className="flex items-center gap-4 animate-fade-in stagger-4">
              <button className="px-8 py-3.5 bg-gold text-onyx text-sm font-semibold tracking-wide hover:bg-gold-light transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,168,76,0.3)]">
                Обсудить проект
              </button>
              <button className="px-8 py-3.5 border border-foreground/20 text-foreground/70 text-sm hover:border-gold/50 hover:text-foreground transition-all duration-300">
                Посмотреть работы
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="flex gap-12 mt-24 animate-fade-in stagger-5">
            {[['7+', 'лет опыта'], ['120+', 'проектов'], ['40+', 'клиентов'], ['18', 'наград']].map(([num, label]) => (
              <div key={label}>
                <div className="font-cormorant text-4xl font-light text-gold">{num}</div>
                <div className="text-xs text-foreground/40 mt-1 tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent to-gold/50 mx-auto" />
        </div>
      </section>

      {/* SERVICES */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Что я делаю</p>
              <h2 className="font-cormorant text-5xl font-light">Услуги</h2>
            </div>
            <div className="w-24 h-[1px] bg-gold/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <div key={s.title} className="glass glass-hover p-8 rounded-sm cursor-pointer group">
                <div className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center mb-6 group-hover:border-gold/70 transition-colors">
                  <Icon name={s.icon} fallback="Star" size={16} className="text-gold" />
                </div>
                <h3 className="font-cormorant text-2xl font-medium mb-2">{s.title}</h3>
                <p className="text-foreground/50 text-sm leading-relaxed">{s.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-gold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Подробнее <Icon name="ArrowRight" size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKS */}
      <section className="relative z-10 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Портфолио</p>
              <h2 className="font-cormorant text-5xl font-light">Избранные работы</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map((w, i) => (
              <div key={w.title} className="group glass glass-hover rounded-sm p-6 cursor-pointer">
                <div className="aspect-[4/3] bg-gradient-to-br from-onyx-mid to-onyx-border rounded-sm mb-4 overflow-hidden flex items-center justify-center">
                  <div className="font-cormorant text-4xl text-gold/20 group-hover:text-gold/40 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-cormorant text-xl font-medium">{w.title}</h3>
                    <p className="text-foreground/40 text-xs mt-1">{w.cat}</p>
                  </div>
                  <span className="text-foreground/30 text-xs">{w.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-6">Обо мне</p>
              <h2 className="font-cormorant text-5xl font-light mb-8">
                Дизайнер с характером,<br />
                <em className="text-gold/80">не шаблоном</em>
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-6">
                Работаю на стыке стратегии и визуала. Каждый проект начинается с глубокого понимания бизнеса — только потом рождается дизайн.
              </p>
              <p className="text-foreground/60 leading-relaxed mb-10">
                За 7 лет я помог брендам от стартапов до международных компаний найти свой язык и говорить на нём уверенно.
              </p>
              <button className="flex items-center gap-3 text-gold text-sm group">
                <span className="border-b border-gold/40 group-hover:border-gold transition-colors">Скачать резюме</span>
                <Icon name="Download" size={14} />
              </button>
            </div>
            <div className="relative">
              <div className="glass rounded-sm p-8">
                {[
                  { skill: 'Брендинг & Айдентика', pct: 95 },
                  { skill: 'UI/UX Дизайн', pct: 90 },
                  { skill: 'Моушн-дизайн', pct: 75 },
                  { skill: 'Стратегия бренда', pct: 85 },
                ].map(({ skill, pct }) => (
                  <div key={skill} className="mb-6 last:mb-0">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground/70">{skill}</span>
                      <span className="text-gold text-xs">{pct}%</span>
                    </div>
                    <div className="h-[2px] bg-onyx-border rounded-full overflow-hidden">
                      <div className="h-full progress-gold rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-gold/20 rounded-sm" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-gold/10 rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-[1px] h-16 bg-gradient-to-b from-gold/40 to-transparent mx-auto mb-12" />
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">Начнём?</p>
          <h2 className="font-cormorant text-6xl font-light mb-6">
            Есть проект?<br />Поговорим.
          </h2>
          <p className="text-foreground/50 mb-10">
            Отвечаю в течение 24 часов. Первая консультация — бесплатно.
          </p>
          <button className="px-12 py-4 bg-gold text-onyx font-semibold text-sm tracking-widest hover:bg-gold-light transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,168,76,0.4)]">
            НАПИСАТЬ МНЕ
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-onyx-border py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-foreground/30 text-xs">
          <span className="font-cormorant text-gold text-lg">АРЕНА</span>
          <span>© 2024 Все права защищены</span>
          <div className="flex gap-4">
            {['Telegram', 'Behance', 'Instagram'].map(s => (
              <a key={s} href="#" className="hover:text-gold transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </footer>

      {showLogin && <LoginModal onLogin={onLogin} onClose={() => setShowLogin(false)} />}
    </div>
  );
}