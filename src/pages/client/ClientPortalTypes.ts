export const AUTH_API     = "https://functions.poehali.dev/6939c14f-545b-476e-9041-fb66c4517ab0";
export const CRM_API      = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";
export const SETTINGS_API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";
export const SESSION_KEY  = "client_session";

export interface Session { token: string; name: string; client_id: number; project_token?: string; }

export interface ProjectData { id: number; name: string; status: string; deadline: string; discount_percent: number; vat_mode: string; vat_rate: number; client_name: string; contact_person: string; }
export interface WorkItem { id: number; name: string; quantity: number; unit: string; price: number; }
export interface Estimate { id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number; items: WorkItem[]; }
export interface ChatMessage { id: number; author_name: string; author_role: string; text: string; created_at: string; }
export interface BriefField { key: string; label: string; placeholder: string; type: "text" | "number" | "textarea"; enabled: boolean; }
export interface Brief { style: string; area: number; budget: number; rooms: string; wishes: string; color_palette: string; furniture: string; restrictions: string; extra: string; client_comment: string; [key: string]: unknown; }
export interface Reference { id: number; url: string; caption: string; uploaded_by: string; }
export interface ProjectDoc { id: number; name: string; url: string; doc_type: string; uploaded_by: string; is_signed: boolean; created_at: string; }
export interface Payment { id: number; amount: number; label: string; is_paid: boolean; paid_at: string | null; }

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:  { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-600" },
  done:   { label: "Завершён", color: "bg-green-50 text-green-600" },
  paused: { label: "Пауза",    color: "bg-amber-50 text-amber-600" },
};

export const NAV_TABS = [
  { id: "estimate",   label: "Смета",     icon: "FileText" },
  { id: "finance",    label: "Финансы",   icon: "CreditCard" },
  { id: "chat",       label: "Чат",       icon: "MessageSquare" },
  { id: "documents",  label: "Документы", icon: "Paperclip" },
  { id: "brief",      label: "Бриф",      icon: "ClipboardList" },
  { id: "references", label: "Референсы", icon: "Images" },
];

export const DOC_TYPES: Record<string, string> = { contract: "Договор", act: "Акт", invoice: "Счёт", other: "Документ" };

export const fmtTime = (iso: string) => {
  const d = new Date(iso); const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
};