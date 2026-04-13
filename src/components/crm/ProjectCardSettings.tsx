import Icon from "@/components/ui/icon";
import { ProjectData, ClientShort, STATUS_OPTIONS, TeamMember, API } from "./ProjectCardTypes";

const OBJECT_TYPES = [
  { id: "", label: "Не указан" },
  { id: "apartment", label: "Квартира" },
  { id: "house", label: "Дом" },
  { id: "office", label: "Офис" },
  { id: "commercial", label: "Коммерческое помещение" },
];

interface MemberOption { name: string; label: string; }
interface RoleOption { id: string; label: string; }

interface Props {
  project: ProjectData;
  setProject: (fn: (p: ProjectData | null) => ProjectData | null) => void;
  clients: ClientShort[];
  saving: boolean;
  hasChanges: boolean;
  saveStatus: "idle" | "saved" | "error";
  onSave: () => void;
  team: TeamMember[];
  newMember: { member_name: string; role: string };
  setNewMember: (fn: (p: { member_name: string; role: string }) => { member_name: string; role: string }) => void;
  onAddMember: () => void;
  onDeleteMember?: (id: number) => void;
  memberOptions?: MemberOption[];
  roleOptions?: RoleOption[];
}

export default function ProjectCardSettings({
  project, setProject, clients, saving, hasChanges, saveStatus, onSave,
  team, newMember, setNewMember, onAddMember, onDeleteMember,
  memberOptions = [], roleOptions = [],
}: Props) {
  return (
    <div className="card-surface rounded-2xl p-5 mb-6 space-y-5">

      {/* Строка 1: Клиент + Статус */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Клиент</label>
          <select value={project.client_id || ""} onChange={e => setProject(p => p ? { ...p, client_id: Number(e.target.value) || null } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
            <option value="">Не выбран</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Статус</label>
          <select value={project.status} onChange={e => setProject(p => p ? { ...p, status: e.target.value } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Строка 2: Адрес объекта */}
      <div>
        <label className="text-xs text-ink-muted font-medium mb-1.5 block">Адрес объекта</label>
        <input value={project.object_address || ""} onChange={e => setProject(p => p ? { ...p, object_address: e.target.value } : p)}
          placeholder="ул. Ленина, 31, кв. 5"
          className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
      </div>

      {/* Строка 3: Вид объекта + Площадь + Срок */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Вид объекта</label>
          <select value={project.object_type || ""} onChange={e => setProject(p => p ? { ...p, object_type: e.target.value } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
            {OBJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Площадь объекта</label>
          <input value={project.object_area || ""} onChange={e => setProject(p => p ? { ...p, object_area: e.target.value } : p)}
            placeholder="85 м²"
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
        </div>
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Срок работ</label>
          <input value={project.project_duration || ""} onChange={e => setProject(p => p ? { ...p, project_duration: e.target.value } : p)}
            placeholder="3 месяца"
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
        </div>
      </div>

      {/* Команда */}
      <div>
        <label className="text-xs text-ink-muted font-medium mb-2 block">Команда</label>
        <div className="flex gap-2 mb-2">
          {memberOptions.length > 0 ? (
            <select value={newMember.member_name} onChange={e => setNewMember(p => ({ ...p, member_name: e.target.value }))}
              className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              <option value="">Выбрать сотрудника...</option>
              {memberOptions.map(m => <option key={m.name} value={m.name}>{m.label}</option>)}
            </select>
          ) : (
            <input value={newMember.member_name} onChange={e => setNewMember(p => ({ ...p, member_name: e.target.value }))}
              placeholder="Имя сотрудника" className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          )}
          {roleOptions.length > 0 ? (
            <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
              className="w-40 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              <option value="">Роль...</option>
              {roleOptions.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
            </select>
          ) : (
            <input value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
              placeholder="Роль" className="w-36 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          )}
          <button onClick={onAddMember} disabled={!newMember.member_name.trim()}
            className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
            <Icon name="Plus" size={15} />
          </button>
        </div>
        {team.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {team.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-snow border border-snow-dark rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  {m.member_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium leading-none">{m.member_name}</p>
                  {m.role && <p className="text-[10px] text-ink-faint mt-0.5">{m.role}</p>}
                </div>
                {onDeleteMember && (
                  <button onClick={() => onDeleteMember(m.id)} className="ml-1 text-ink-faint hover:text-red-500 transition-colors">
                    <Icon name="X" size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {team.length === 0 && <p className="text-xs text-ink-faint">Команда не назначена</p>}
      </div>

      {/* Сохранить */}
      <div className="flex items-center justify-between pt-4 border-t border-snow-dark">
        <div>
          {saveStatus === "saved" && <span className="flex items-center gap-1 text-xs text-green-600"><Icon name="Check" size={14} /> Сохранено</span>}
          {saveStatus === "error" && <span className="flex items-center gap-1 text-xs text-red-500"><Icon name="AlertCircle" size={14} /> Ошибка</span>}
        </div>
        <button onClick={onSave} disabled={saving || !hasChanges}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
          Сохранить
        </button>
      </div>
    </div>
  );
}