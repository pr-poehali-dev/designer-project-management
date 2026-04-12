export const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

export interface WorkItem {
  id: number; name: string; quantity: number; unit: string; price: number; sort_order: number; estimate_id?: number;
}

export interface Template { id: number; name: string; item_count: number; }

export interface TemplateItem { name: string; quantity: number; unit: string; price: number; }
