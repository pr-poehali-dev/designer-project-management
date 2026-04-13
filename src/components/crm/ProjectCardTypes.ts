export interface ProjectData {
  id: number; name: string; client_id: number | null; client_name: string;
  status: string; deadline: string; discount_percent: number;
  vat_mode: string; vat_rate: number;
}
export interface Estimate {
  id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number;
}
export interface TeamMember { id: number; member_name: string; role: string; }
export interface ClientShort { id: number; name: string; }
export interface Brief { style: string; area: string; budget: string; rooms: string; wishes: string; color_palette: string; furniture: string; restrictions: string; extra: string; client_comment: string; }
export interface Reference { id: number; url: string; caption: string; uploaded_by: string; }
export interface ProjectDoc { id: number; name: string; url: string; doc_type: string; uploaded_by: string; is_signed: boolean; created_at: string; }
export interface Payment { id: number; amount: number; label: string; is_paid: boolean; paid_at: string | null; }

export type Tab = "estimates" | "team" | "brief" | "documents" | "payments" | "references";

export const STATUS_OPTIONS = [
  { id: "draft", label: "Черновик" },
  { id: "active", label: "В работе" },
  { id: "done", label: "Завершён" },
  { id: "paused", label: "Пауза" },
];

export const VAT_OPTIONS = [
  { id: "none", label: "Без НДС" },
  { id: "included", label: "НДС включён в стоимость" },
  { id: "added", label: "НДС сверх стоимости" },
];

export const BRIEF_EMPTY: Brief = {
  style: "", area: "", budget: "", rooms: "", wishes: "",
  color_palette: "", furniture: "", restrictions: "", extra: "", client_comment: "",
};

export const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";
export const PDF_API = "https://functions.poehali.dev/79538cf9-12ec-42f3-9e60-aaf7a9edfba2";
