import { useMemo, useState } from "react";
import { useStore, monthOf, fmtMoney, listMonths, MAIN_CATEGORIES, MainCategory } from "../../store";
import { PageHeader, Stat } from "../PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export function Stats() {
  const { db } = useStore();
  const months = listMonths(12);
  const [month, setMonth] = useState(months[0]);
  const [user, setUser] = useState("all");
  const [detail, setDetail] = useState<MainCategory | null>(null);

  const data = useMemo(() => {
    const inMonth = db.records.filter(r => monthOf(r.date) === month && (user === "all" || r.userId === user));
    const total = inMonth.reduce((s, r) => s + r.amount, 0);
    const byMain: { [k in MainCategory]: number } = { "干饭钱": 0, "潇洒钱": 0, "其他钱": 0 };
    inMonth.forEach(r => {
      const c = db.categories.find(c => c.id === r.subCategoryId);
      if (c) byMain[c.main] += r.amount;
    });
    const budget = db.budgets.find(b => b.month === month);
    const repay = db.repayments.filter(r => r.month === month && (user === "all" || r.userId === user)).reduce((s, r) => s + r.items.reduce((a, b) => a + b.amount, 0), 0);
    return { total, byMain, budget, repay, inMonth };
  }, [db, month, user]);

  const bMap = { "干饭钱": data.budget?.ganfan ?? 0, "潇洒钱": data.budget?.xiaosa ?? 0, "其他钱": data.budget?.other ?? 0 };

  const subDetail = (main: MainCategory) => {
    const map = new Map<string, number>();
    data.inMonth.forEach(r => {
      const c = db.categories.find(c => c.id === r.subCategoryId);
      if (c && c.main === main) map.set(c.name, (map.get(c.name) ?? 0) + r.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div>
      <PageHeader title="统计" subtitle="Statistics" right={
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={user} onValueChange={setUser}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部用户</SelectItem>
              {db.users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      } />

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <Stat label="当月总支出" value={fmtMoney(data.total)} accent />
        <Stat label="本月还款" value={fmtMoney(data.repay)} />
      </div>

      <div className="space-y-3">
        {MAIN_CATEGORIES.map((m, i) => {
          const used = data.byMain[m]; const bud = bMap[m];
          const pct = bud ? Math.min(100, used / bud * 100) : 0;
          const color = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"][i];
          return (
            <div key={m} className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <h3>{m}</h3>
                  <span className="num text-muted-foreground" style={{ fontSize: 14 }}>{used > bud && bud > 0 ? "已超支" : ""}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDetail(m)}>子类统计</Button>
              </div>
              <div className="grid grid-cols-3 gap-6 mb-3">
                <div>
                  <div className="text-muted-foreground tracking-[0.2em] uppercase" style={{ fontSize: 12 }}>预算</div>
                  <div className="num">¥{fmtMoney(bud)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground tracking-[0.2em] uppercase" style={{ fontSize: 12 }}>已使用</div>
                  <div className="num">¥{fmtMoney(used)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground tracking-[0.2em] uppercase" style={{ fontSize: 12 }}>占比</div>
                  <div className="num">{bud ? pct.toFixed(1) : "—"}<span style={{ fontSize: 14 }}>%</span></div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail} · 子类统计</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-2">
            {detail && subDetail(detail).map(([name, v]) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-md bg-muted">
                <span>{name}</span>
                <span className="num">¥{fmtMoney(v)}</span>
              </div>
            ))}
            {detail && subDetail(detail).length === 0 && <div className="text-center text-muted-foreground py-6">暂无</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
