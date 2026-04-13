import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import LoginModal from "@/components/LoginModal";

const HERO_IMG = "https://cdn.poehali.dev/projects/9603c9de-6ac8-4db7-ab98-e327eac054fb/files/926f782b-b2ce-4e12-9ffb-139ad56894f1.jpg";
const FEATURE_IMG = "https://cdn.poehali.dev/projects/9603c9de-6ac8-4db7-ab98-e327eac054fb/files/b562a559-d36c-4c45-9940-5c24701a7c50.jpg";

interface Props { onLogin: () => void; }

const FEATURES = [
  { icon: "FolderOpen",    title: "Проекты",         desc: "Все объекты в одном месте. Статус, клиент, смета, договор, этапы — одним взглядом." },
  { icon: "Calculator",   title: "Сметы и КП",       desc: "Составляйте сметы прямо в системе. Генерируйте красивые PDF коммерческие предложения." },
  { icon: "FileText",     title: "Договоры",         desc: "Создавайте договоры по шаблонам. Отправляйте клиентам, отмечайте подписание." },
  { icon: "Wallet",       title: "Финансы",          desc: "График платежей, акты, счета. Видите сколько получено и сколько ещё ожидается." },
  { icon: "Users",        title: "CRM клиентов",     desc: "База клиентов с историей, заметками, документами и встроенным мессенджером." },
  { icon: "ListChecks",   title: "Этапы работ",      desc: "Управляйте ходом проекта по этапам. Загружайте фото, отчёты, отслеживайте прогресс." },
  { icon: "ClipboardList","title": "Бриф онлайн",    desc: "Отправьте клиенту ссылку — он заполнит бриф сам. Вы получите уведомление в чат." },
  { icon: "MessageSquare","title": "Чат с клиентом", desc: "Встроенный чат прямо в проекте. Клиент заходит по ссылке без регистрации." },
  { icon: "Sparkles",     title: "AI-помощник",      desc: "Голосовой ИИ создаёт задачи, открывает разделы и отвечает на вопросы голосом." },
];

const STEPS = [
  { num: "01", title: "Добавьте клиента",   desc: "Заведите карточку клиента с контактами и юридическими данными" },
  { num: "02", title: "Создайте проект",    desc: "Привяжите к клиенту, укажите адрес объекта и сроки" },
  { num: "03", title: "Отправьте бриф",     desc: "Клиент получает ссылку и заполняет пожелания онлайн" },
  { num: "04", title: "Работайте в системе", desc: "Смета, договор, этапы, финансы — всё в одном окне" },
];

const TESTIMONIALS = [
  { name: "Анна К.", role: "Дизайнер интерьеров", text: "Раньше вёл всё в таблицах и потерял договор с клиентом. Теперь всё в одном месте, ничего не теряется." },
  { name: "Михаил Р.", role: "Архитектурное бюро", text: "AI-помощник просто вау. Говорю вслух «создай задачу» — и всё. Клиентам на презентации показываю как фишку." },
  { name: "Елена В.", role: "Студия дизайна", text: "Клиенты в восторге от личного кабинета. Они видят этапы, пишут в чат, подписывают документы. Профессионально." },
];

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = to / 40;
        const t = setInterval(() => {
          start += step;
          if (start >= to) { setVal(to); clearInterval(t); } else setVal(Math.floor(start));
        }, 30);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <div ref={ref} className="font-display text-5xl md:text-6xl font-light tabular-nums">{val}{suffix}</div>;
}

export default function LandingPage({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-body overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <span className="font-display text-lg font-bold tracking-tight">Офис Дизайнера</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[["Возможности", "#features"], ["Как работает", "#how"], ["Отзывы", "#reviews"]].map(([label, href]) => (
              <a key={label} href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{label}</a>
            ))}
          </div>
          <button onClick={() => setShowLogin(true)}
            className="h-9 px-5 bg-[#0A0A0A] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            Войти в систему
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 mb-8">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                CRM для дизайнеров интерьеров
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-[68px] leading-[1.0] font-light tracking-tight mb-6">
                Весь бизнес<br />
                дизайнера —<br />
                <span className="font-semibold">в одном окне</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed max-w-md mb-10">
                Клиенты, проекты, сметы, договоры, этапы и финансы. Плюс AI-помощник, который работает голосом.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowLogin(true)}
                  className="h-12 px-8 bg-[#0A0A0A] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105">
                  Попробовать бесплатно
                </button>
                <a href="#features"
                  className="h-12 px-8 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:border-gray-400 transition-colors flex items-center gap-2">
                  Посмотреть возможности <Icon name="ArrowDown" size={14} />
                </a>
              </div>
              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-100">
                {[["500+", "дизайнеров"], ["12 000+", "проектов"], ["97%", "довольны"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-xl font-semibold">{n}</div>
                    <div className="text-xs text-gray-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200">
                <img src={HERO_IMG} alt="Офис Дизайнера" className="w-full h-[480px] object-cover" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="CheckCircle" size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Бриф заполнен</p>
                  <p className="text-[11px] text-gray-400">Морозов Сергей · 2 мин назад</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Wallet" size={14} className="text-purple-500" />
                  <span className="text-xs font-medium text-gray-600">Получено</span>
                </div>
                <div className="font-display text-xl font-bold text-gray-900">₽ 124 000</div>
                <div className="text-[11px] text-green-500 mt-0.5">+18% к прошлому месяцу</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Возможности</p>
            <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4">
              Всё что нужно дизайнеру
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Больше не нужны таблицы, мессенджеры и разные приложения. Всё в одной системе.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                onMouseEnter={() => setActiveFeature(i)}
                className={`rounded-2xl p-6 cursor-default transition-all duration-200 border ${
                  activeFeature === i
                    ? "bg-[#0A0A0A] text-white border-transparent shadow-xl scale-[1.02]"
                    : "bg-white border-gray-100 hover:border-gray-200"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  activeFeature === i ? "bg-white/10" : "bg-gray-50"
                }`}>
                  <Icon name={f.icon} size={18} className={activeFeature === i ? "text-white" : "text-gray-600"} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${activeFeature === i ? "text-white/70" : "text-gray-500"}`}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Как работает</p>
              <h2 className="font-display text-4xl font-light tracking-tight mb-12">
                Начните работу<br />за 5 минут
              </h2>
              <div className="space-y-8">
                {STEPS.map((s, i) => (
                  <div key={s.num} className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center shrink-0 font-display text-sm font-semibold text-gray-400">
                      {s.num}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-100">
              <img src={FEATURE_IMG} alt="Система в работе" className="w-full h-[500px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── AI HIGHLIGHT ── */}
      <section className="py-24 px-6 bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-8">
                <span className="text-lg">✦</span> AI-помощник нового поколения
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-6">
                Говорите вслух —<br />
                <span className="font-semibold">он делает</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-10">
                Встроенный голосовой ИИ понимает команды на русском. Создаёт задачи, открывает проекты, отвечает на вопросы — не отрывая вас от работы.
              </p>
              <div className="space-y-4">
                {[
                  "«Создай задачу — позвонить Морозову завтра»",
                  "«Какие дедлайны на этой неделе?»",
                  "«Открой проект Проспект Ленина»",
                  "«Сколько получено денег в этом месяце?»",
                ].map(cmd => (
                  <div key={cmd} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <Icon name="Mic" size={14} className="text-white/40 shrink-0" />
                    <span className="text-sm text-white/80">{cmd}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {/* Имитация чата с ассистентом */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <span className="text-base">✦</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Жарвис</p>
                    <p className="text-[11px] text-white/40">AI-помощник · онлайн</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { from: "user",      text: "Какие проекты сейчас в работе?" },
                    { from: "assistant", text: "У вас 3 активных проекта: Проспект Ленина, ЖК Авеню и Офис Климова. Ближайший дедлайн — Климов, 20 апреля." },
                    { from: "user",      text: "Создай задачу: согласовать смету с Морозовым" },
                    { from: "assistant", text: "✓ Задача создана! «Согласовать смету с Морозовым» — приоритет средний, назначена на сегодня." },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.from === "user"
                          ? "bg-white text-gray-900 rounded-br-sm"
                          : "bg-white/10 text-white/90 rounded-bl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENT PORTAL ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Личный кабинет клиента</p>
          <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4">
            Клиент всегда в курсе
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-16">
            Отправьте клиенту ссылку — он войдёт без регистрации и увидит всё что нужно
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "Eye",           title: "Ход работ",      desc: "Видит этапы и прогресс проекта" },
              { icon: "FileText",      title: "Документы",      desc: "Смотрит и подписывает договоры" },
              { icon: "CreditCard",    title: "Оплаты",         desc: "График платежей и статус оплат" },
              { icon: "MessageCircle", title: "Чат",            desc: "Пишет напрямую дизайнеру" },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-left">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon name={item.icon} size={18} className="text-gray-600" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { to: 500,  suffix: "+", label: "Дизайнеров используют" },
              { to: 12,   suffix: "к+", label: "Проектов создано" },
              { to: 97,   suffix: "%",  label: "Довольных пользователей" },
              { to: 5,    suffix: " мин", label: "До начала работы" },
            ].map(s => (
              <div key={s.label}>
                <CountUp to={s.to} suffix={s.suffix} />
                <p className="text-sm text-gray-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Отзывы</p>
            <h2 className="font-display text-4xl font-light tracking-tight">Говорят дизайнеры</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Icon key={i} name="Star" size={14} className="text-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">«{t.text}»</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 bg-[#0A0A0A] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-4xl mb-6 block">✦</span>
          <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-6">
            Начните вести бизнес<br />
            <span className="font-semibold">профессионально</span>
          </h2>
          <p className="text-white/50 mb-10 text-lg">
            Первые 14 дней бесплатно. Без карты. Без обязательств.
          </p>
          <button onClick={() => setShowLogin(true)}
            className="h-14 px-10 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl shadow-white/10">
            Начать бесплатно →
          </button>
          <p className="text-white/30 text-xs mt-6">Уже более 500 дизайнеров доверяют Офису Дизайнера</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-white/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white">✦</span>
            <span className="text-white font-semibold text-sm">Офис Дизайнера</span>
          </div>
          <p className="text-xs">© 2026 Офис Дизайнера. CRM для дизайнеров интерьеров.</p>
          <button onClick={() => setShowLogin(true)} className="text-xs text-white/60 hover:text-white transition-colors">
            Войти в систему →
          </button>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={() => { setShowLogin(false); onLogin(); }} />}
    </div>
  );
}
