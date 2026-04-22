import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { Login } from "./components/Login";
import { Sidebar, PageKey } from "./components/Sidebar";
import { QuickAdd } from "./components/QuickAdd";
import { Dashboard } from "./components/pages/Dashboard";
import { Records } from "./components/pages/Records";
import { Stats } from "./components/pages/Stats";
import { Installments } from "./components/pages/Installments";
import { Repayments } from "./components/pages/Repayments";
import { Budgets } from "./components/pages/Budgets";
import { Categories } from "./components/pages/Categories";
import { Hui } from "./components/pages/Hui";
import { Users } from "./components/pages/Users";
import { Toaster } from "./components/ui/sonner";
import { Menu, Plus } from "lucide-react";

function Shell() {
  const { currentUser, loading } = useStore();
  const [page, setPage] = useState<PageKey>("dashboard");
  const [quick, setQuick] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "n" || e.key === "N") && !(e.target as HTMLElement)?.matches("input,textarea,select")) {
        e.preventDefault(); setQuick(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">加载中...</div>;
  if (!currentUser) return <Login />;

  const P = {
    dashboard: Dashboard, records: Records, stats: Stats,
    installments: Installments, repayments: Repayments, budgets: Budgets,
    categories: Categories, hui: Hui, users: Users,
  }[page];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden lg:block h-full">
        <Sidebar page={page} onChange={setPage} onQuickAdd={() => setQuick(true)} />
      </div>
      {mobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobile(false)}>
          <div onClick={e => e.stopPropagation()} className="h-full">
            <Sidebar page={page} onChange={p => { setPage(p); setMobile(false); }} onQuickAdd={() => { setQuick(true); setMobile(false); }} />
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      <main className="app-bg flex-1 overflow-y-auto relative">
        <div className="pointer-events-none fixed top-8 right-8 text-muted-foreground/40 tracking-[0.4em] uppercase hidden lg:block z-0" style={{ fontSize: 11 }}>
          ✦ &nbsp; Ledger · MMXXVI
        </div>
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/85 backdrop-blur border-b border-border">
          <button onClick={() => setMobile(true)} className="p-2 -ml-2"><Menu size={20} /></button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>记账系统</div>
          <button onClick={() => setQuick(true)} className="p-2 -mr-2 text-accent"><Plus size={20} /></button>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-10">
          <P />
        </div>
      </main>

      <QuickAdd open={quick} onOpenChange={setQuick} />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
