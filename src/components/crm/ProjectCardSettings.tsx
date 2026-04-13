import Icon from "@/components/ui/icon";
import { ProjectData, ClientShort, STATUS_OPTIONS, VAT_OPTIONS } from "./ProjectCardTypes";

interface Props {
  project: ProjectData;
  setProject: (fn: (p: ProjectData | null) => ProjectData | null) => void;
  clients: ClientShort[];
  saving: boolean;
  hasChanges: boolean;
  saveStatus: "idle" | "saved" | "error";
  onSave: () => void;
}

export default function ProjectCardSettings({
  project, setProject, clients, saving, hasChanges, saveStatus, onSave,
}: Props) {
  return (
    <div className="card-surface rounded-2xl p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Дедлайн</label>
          <input type="date" value={project.deadline || ""} onChange={e => setProject(p => p ? { ...p, deadline: e.target.value } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
        </div>
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">Скидка, %</label>
          <input type="number" min={0} max={100} value={project.discount_percent || 0}
            onChange={e => setProject(p => p ? { ...p, discount_percent: Number(e.target.value) } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-xs text-ink-muted font-medium mb-1.5 block">НДС</label>
          <select value={project.vat_mode} onChange={e => setProject(p => p ? { ...p, vat_mode: e.target.value } : p)}
            className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
            {VAT_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        {project.vat_mode !== "none" && (
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">Ставка НДС, %</label>
            <input type="number" min={0} max={100} value={project.vat_rate || 20}
              onChange={e => setProject(p => p ? { ...p, vat_rate: Number(e.target.value) } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-snow-dark">
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
