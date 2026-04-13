import { useState } from "react";
import Icon from "@/components/ui/icon";
import EstimateTable from "../EstimateTable";
import { API, ProjectData, Estimate } from "../ProjectCardTypes";

interface Props {
  projectId: number;
  project: ProjectData;
  estimates: Estimate[];
  onReload: () => void;
  onShowKp: () => void;
}

export default function PanelEstimate({ projectId, project, estimates, onReload, onShowKp }: Props) {
  const [addingEstimate, setAddingEstimate] = useState(false);

  const addEstimate = async () => {
    setAddingEstimate(true);
    try {
      const r = await fetch(`${API}?action=estimates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, name: "Дополнительная смета" }),
      });
      const data = await r.json();
      if (data.ok) onReload();
    } catch { /* ignore */ } finally { setAddingEstimate(false); }
  };

  const deleteEstimate = async (id: number) => {
    await fetch(`${API}?action=estimates&id=${id}`, { method: "DELETE" });
    onReload();
  };

  return (
    <div className="space-y-6">
      {/* Кнопка КП */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-faint">Редактор сметы</p>
        <button onClick={onShowKp}
          className="h-9 px-4 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="FileDown" size={14} /> Скачать КП
        </button>
      </div>

      {/* Основная смета */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Основная смета</p>
        <EstimateTable projectId={projectId} estimateId={null} project={project} onUpdated={onReload} />
      </div>

      {/* Дополнительные сметы */}
      {estimates.map(est => (
        <div key={est.id}>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide flex-1">{est.name}</p>
            <button onClick={() => deleteEstimate(est.id)} className="text-ink-faint hover:text-red-500 transition-colors">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
          <EstimateTable projectId={projectId} estimateId={est.id} project={project} onUpdated={onReload} />
        </div>
      ))}

      {/* Добавить смету */}
      <button onClick={addEstimate} disabled={addingEstimate}
        className="w-full py-2.5 border border-dashed border-snow-dark text-sm text-ink-muted hover:text-ink hover:border-ink-faint rounded-xl transition-colors flex items-center justify-center gap-2">
        {addingEstimate ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Plus" size={14} />}
        Добавить смету
      </button>
    </div>
  );
}
