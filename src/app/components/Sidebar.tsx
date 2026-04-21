import { useStore } from "../store";
import { LayoutDashboard, Receipt, BarChart3, CalendarRange, Wallet, PiggyBank, Tags, Users, Plus, LogOut, Coins } from "lucide-react";

export type PageKey = "dashboard" | "records" | "stats" | "installments" | "repayments" | "budgets" | "categories" | "hui" | "users";

const items: { key: PageKey; label: string; icon: any }[] = [
  { key: "dashboard", label: "仪表盘", icon: LayoutDashboard },
  { key: "records", label: "记账记录", icon: Receipt },
  { key: "stats", label: "统计", icon: BarChart3 },
  { key: "installments", label: "分期费用", icon: CalendarRange },
  { key: "repayments", label: "还款管理", icon: Wallet },
  { key: "budgets", label: "预算管理", icon: PiggyBank },
  { key: "categories", label: "分类管理", icon: Tags },
  { key: "hui", label: "会钱管理", icon: Coins },
  { key: "users", label: "用户管理", icon: Users },
];

export function Sidebar({ page, onChange, onQuickAdd }: { page: PageKey; onChange: (p: PageKey) => void; onQuickAdd: () => void }) {
  const { currentUser, setDB } = useStore();
  return (
    <aside className="sidebar-bg w-72 h-full shrink-0 text-sidebar-foreground flex flex-col border-r border-sidebar-border relative">
      <div className="px-7 pt-8 pb-6 border-b border-sidebar-border">
        <div className="tracking-[0.35em] uppercase text-sidebar-foreground/40 mb-2" style={{ fontSize: 12 }}>Ledger · 账本</div>
        <div className="flex items-baseline gap-1" style={{ fontFamily: "var(--font-display)", fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1, fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}>
          <span style={{ fontWeight: 300 }}>记</span>
          <span style={{ fontWeight: 500 }}>账</span>
          <span className="italic" style={{ color: "var(--accent)", fontWeight: 400, marginLeft: 4, position: "relative" }}>
            系统
            <span aria-hidden className="absolute" style={{ left: -10, top: -6, color: "var(--accent)", fontSize: 11, opacity: 0.9 }}>✦</span>
          </span>
        </div>
      </div>

      <div className="px-5 pt-6 pb-2">
        <button onClick={onQuickAdd} className="group w-full flex items-center justify-between px-4 py-3.5 rounded-md bg-accent text-accent-foreground hover:brightness-110 transition-all">
          <span className="flex items-center gap-2.5" style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.02em" }}>
            <Plus size={16} strokeWidth={2.2} /> 快速记账
          </span>
          <span className="mono opacity-70 px-1.5 py-0.5 rounded border border-accent-foreground/30" style={{ fontSize: 12 }}>N</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {items.map(it => {
          const active = page === it.key;
          const Icon = it.icon;
          return (
            <button key={it.key} onClick={() => onChange(it.key)}
              className={`w-full flex items-center gap-3.5 px-4 py-4 rounded-md transition-all text-left ${active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
              style={{ letterSpacing: "0.04em", fontSize: "15px" }}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} className={active ? "text-accent" : ""} />
              <span>{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </nav>

      <div className="mx-5 mb-6 mt-2 p-4 rounded-md bg-sidebar-accent/40 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0" style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--accent)" }}>
            {currentUser?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate" style={{ fontSize: 14 }}>{currentUser?.username}</div>
            <div className="text-sidebar-foreground/50 tracking-[0.2em] uppercase mt-0.5" style={{ fontSize: 12 }}>
              {currentUser?.isAdmin ? "Admin" : "Member"}
            </div>
          </div>
        </div>
        <button onClick={() => setDB(d => ({ ...d, currentUserId: null }))} className="text-sidebar-foreground/50 hover:text-accent p-2 shrink-0" title="退出登录">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
