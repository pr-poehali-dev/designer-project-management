const DESIGNER_AUTH_API = "https://functions.poehali.dev/426f5ef8-9204-428d-9fc1-c074b9bba61b";
const SESSION_KEY = "designer_session";

export interface DesignerSession {
  token: string;
  name: string;
  designer_id: number;
  plan: string;
}

export function getSession(): DesignerSession | null {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: DesignerSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) return {};
  return { "X-Designer-Token": session.token };
}

export async function loginDesigner(email: string, password: string): Promise<DesignerSession> {
  const r = await fetch(`${DESIGNER_AUTH_API}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || "Ошибка входа");
  const session: DesignerSession = { token: data.token, name: data.name, designer_id: data.designer_id, plan: data.plan };
  saveSession(session);
  return session;
}

export async function registerDesigner(email: string, password: string, name: string): Promise<DesignerSession> {
  const r = await fetch(`${DESIGNER_AUTH_API}?action=register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || "Ошибка регистрации");
  const session: DesignerSession = { token: data.token, name: data.name, designer_id: data.designer_id, plan: data.plan || "free" };
  saveSession(session);
  return session;
}

export async function verifySession(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  try {
    const r = await fetch(`${DESIGNER_AUTH_API}?action=me`, {
      headers: { "X-Designer-Token": session.token },
    });
    const data = await r.json();
    return data.ok;
  } catch {
    return false;
  }
}
