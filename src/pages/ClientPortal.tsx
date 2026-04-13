import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ClientLoginScreen from "./client/ClientLoginScreen";
import ClientDashboard from "./client/ClientDashboard";
import { AUTH_API, SESSION_KEY, Session } from "./client/ClientPortalTypes";

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<Session | null>(() => {
    try { const s = sessionStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    if (!session) { setValidating(false); return; }
    (async () => {
      try {
        const r = await fetch(`${AUTH_API}?action=me`, { headers: { "X-Client-Token": session.token } });
        const data = await r.json();
        if (!data.ok) { sessionStorage.removeItem(SESSION_KEY); setSession(null); }
      } catch { /* ignore */ } finally { setValidating(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (validating) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Icon name="LinkOff" size={32} className="text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Ссылка недействительна</p>
      </div>
    </div>
  );

  if (!session) return <ClientLoginScreen projectToken={token} onAuth={s => setSession(s)} />;
  return <ClientDashboard session={session} projectToken={token} onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setSession(null); }} />;
}
