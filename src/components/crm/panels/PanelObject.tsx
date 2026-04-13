import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { ProjectData, TeamMember, ClientShort, Reference } from "../ProjectCardTypes";

const OBJECT_TYPES = [
  { id: "", label: "Не указан" },
  { id: "apartment", label: "Квартира" },
  { id: "house", label: "Частный дом" },
  { id: "office", label: "Офис" },
  { id: "commercial", label: "Коммерческое помещение" },
];

interface Props {
  project: ProjectData;
  setProject: (fn: (p: ProjectData | null) => ProjectData | null) => void;
  clients: ClientShort[];
  team: TeamMember[];
  memberOptions: { name: string; label: string }[];
  roleOptions: { id: string; label: string }[];
  onSave: () => void;
  onAddMember: (m: { member_name: string; role: string }) => void;
  onDeleteMember: (id: number) => void;
  photos: Reference[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-snow-dark rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors bg-white";

export default function PanelObject({
  project, setProject, clients, team, memberOptions, roleOptions,
  onSave, onAddMember, onDeleteMember, photos, onPhotoUpload,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const up = (key: keyof ProjectData, value: string) =>
    setProject(p => p ? { ...p, [key]: value } : p);

  return (
    <div className="space-y-6">
      {/* Основные данные */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Название объекта">
            <input className={inputCls} value={project.name}
              onChange={e => up("name", e.target.value)} onBlur={onSave} />
          </Field>

          <Field label="Клиент">
            <select className={inputCls} value={project.client_id ?? ""}
              onChange={e => { up("client_id" as keyof ProjectData, e.target.value); setTimeout(onSave, 100); }}>
              <option value="">Не выбран</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Адрес объекта">
          <input className={inputCls} placeholder="ул. Пушкина, д. 1, кв. 23" value={project.object_address || ""}
            onChange={e => up("object_address", e.target.value)} onBlur={onSave} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Тип объекта">
            <select className={inputCls} value={project.object_type || ""}
              onChange={e => { up("object_type", e.target.value); setTimeout(onSave, 100); }}>
              {OBJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Площадь, м²">
            <input className={inputCls} placeholder="85" type="number" value={project.object_area || ""}
              onChange={e => up("object_area", e.target.value)} onBlur={onSave} />
          </Field>
          <Field label="Срок работ, дней">
            <input className={inputCls} placeholder="60" type="number" value={project.project_duration || ""}
              onChange={e => up("project_duration", e.target.value)} onBlur={onSave} />
          </Field>
        </div>

        <Field label="Комментарии к объекту">
          <textarea className={`${inputCls} resize-none`} rows={3}
            placeholder="Особенности, нюансы, пожелания..."
            value={project.object_comment || ""}
            onChange={e => up("object_comment", e.target.value)}
            onBlur={onSave} />
        </Field>
      </div>

      {/* Команда */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Сотрудник</p>
        {team.length > 0 ? (
          <div className="space-y-2 mb-3">
            {team.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-snow rounded-xl">
                <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-semibold text-ink shrink-0">
                  {m.member_name[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium flex-1">{m.member_name}</span>
                <button onClick={() => onDeleteMember(m.id)} className="text-ink-faint hover:text-red-500 transition-colors">
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint mb-3">Сотрудник не назначен</p>
        )}
        <AddMemberForm memberOptions={memberOptions} roleOptions={roleOptions} onAdd={onAddMember} />
      </div>

      {/* Фото объекта */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Фото объекта</p>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                className="aspect-square rounded-xl overflow-hidden bg-snow border border-snow-dark hover:opacity-90 transition-opacity">
                <img src={r.url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors border border-dashed border-snow-dark rounded-xl px-4 py-2.5 w-full justify-center">
          <Icon name="Upload" size={14} /> Загрузить фото
        </button>
      </div>
    </div>
  );
}

function AddMemberForm({ memberOptions, roleOptions, onAdd }: {
  memberOptions: { name: string; label: string }[];
  roleOptions: { id: string; label: string }[];
  onAdd: (m: { member_name: string; role: string }) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  return (
    <div className="flex gap-2">
      <select value={name} onChange={e => setName(e.target.value)}
        className="flex-1 border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white">
        <option value="">Выбрать...</option>
        {memberOptions.map(m => <option key={m.name} value={m.name}>{m.label}</option>)}
      </select>
      <button onClick={() => { if (name) { onAdd({ member_name: name, role }); setName(""); setRole(""); } }}
        className="h-10 px-4 bg-ink text-white text-sm rounded-xl hover:bg-ink-light transition-colors shrink-0">
        <Icon name="Plus" size={15} />
      </button>
    </div>
  );
}

import { useState } from "react";