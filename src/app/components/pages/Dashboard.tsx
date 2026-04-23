import { useMemo, useState } from "react";
import { useStore, monthOf, fmtMoney, listMonths, MAIN_CATEGORIES } from "../../store";
import { PageHeader, Stat } from "../PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function Dashboard() {
  const { db } = useStore();
  const months = listMonths(12);
  const [month, setMonth] = useState(months[0]);
  const [trendRange, setTrendRange] = useState<"week" | "months">("week");
  const [moreOpen, setMoreOpen] = useState(false);

  const data = useMemo(() => {
    const inMonth = db.records.filter(r => monthOf(r.date) === month);
    const expense = inMonth.reduce((s, r) => s + r.amount, 0);
    const budget = db.budgets.find(b => b.month === month);
    const installs = db.installments.filter(i => i.start.slice(0, 7) <= month && i.end.slice(0, 7) >= month).reduce((s, i) => s + i.amount, 0);
    const repay = db.repayments.filter(r => r.month === month).reduce((s, r) => s + r.items.reduce((a, b) => a + b.amount, 0), 0);
    const today = new Date();
    const weekTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
      const key = dateKey(date);
      return {
        key,
        label: key.slice(5),
        active: index === 6,
        value: db.records.filter(r => r.date === key).reduce((s, r) => s + r.amount, 0),
      };
    });
    const monthTrend = listMonths(6).reverse().map(m => ({
      key: m,
      label: m.slice(5),
      active: m === month,
      value: db.records.filter(r => monthOf(r.date) === m).reduce((s, r) => s + r.amount, 0),
    }));
    const bySub = new Map<string, number>();
    inMonth.forEach(r => bySub.set(r.subCategoryId, (bySub.get(r.subCategoryId) ?? 0) + r.amount));
    const ranking = Array.from(bySub.entries()).map(([id, v]) => {
      const c = db.categories.find(c => c.id === id);
      return { name: c?.name ?? "未知", main: c?.main ?? "", value: v };
    }).sort((a, b) => b.value - a.value);
    const recent = [...inMonth].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return { expense, budget, installs, repay, weekTrend, monthTrend, ranking, recent };
  }, [db, month]);

  const budgetTotal = data.budget?.total ?? 0;
  const left = Math.max(0, budgetTotal - data.expense);
  const max = Math.max(...data.ranking.map(r => r.value), 1);
  const trend = trendRange === "week" ? data.weekTrend : data.monthTrend;
  const trendMax = Math.max(...trend.map(t => t.value), 1);
  const trendTitle = trendRange === "week" ? "近7日支出走势" : "近6月支出走势";

  return (
    <div>
      <PageHeader title="仪表盘" subtitle="Overview" right={
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat label="当月支出" value={fmtMoney(data.expense)} accent hint={`${month}`} />
        <Stat label="月预算" value={fmtMoney(budgetTotal)} />
        <Stat label="预算剩余" value={fmtMoney(left)} hint={budgetTotal ? `${Math.round(left / budgetTotal * 100)}%` : "未设预算"} />
        <Stat label="当月分期" value={fmtMoney(data.installs)} />
        <Stat label="当月还款" value={fmtMoney(data.repay)} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3 mb-3">
        <div className="p-5 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3>支出走势</h3>
            <Tabs value={trendRange} onValueChange={(value) => setTrendRange(value as "week" | "months")}>
              <TabsList className="h-8 rounded-md">
                <TabsTrigger value="week" className="rounded-sm px-3" style={{ fontSize: 12 }}>近7日</TabsTrigger>
                <TabsTrigger value="months" className="rounded-sm px-3" style={{ fontSize: 12 }}>近6月</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-end gap-3 h-60 pt-2">
            {trend.map((t) => {
              const h = Math.max(2, (t.value / trendMax) * 100);
              return (
                <div key={t.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="num text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 12 }}>¥{fmtMoney(t.value)}</div>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${h}%`, background: t.active ? "var(--accent)" : "var(--chart-2)" }} />
                  <div className="text-muted-foreground mono" style={{ fontSize: 12 }}>{t.label}</div>
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>{trendTitle} · 单位：元 · 最大 ¥{fmtMoney(trendMax)}</div>
        </div>

        <div className="p-5 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3>分类支出排行</h3>
            <button onClick={() => setMoreOpen(true)} className="text-accent hover:underline" style={{ fontSize: 13 }}>更多 →</button>
          </div>
          <div className="space-y-3">
            {data.ranking.length === 0 && <div className="text-muted-foreground py-8 text-center">暂无数据</div>}
            {data.ranking.slice(0, 6).map((r, i) => {
              const color = MAIN_CATEGORIES.indexOf(r.main as any) === 0 ? "var(--chart-1)" : MAIN_CATEGORIES.indexOf(r.main as any) === 1 ? "var(--chart-2)" : "var(--chart-3)";
              return (
                <div key={i}>
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="num text-muted-foreground" style={{ fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</span>
                      <span>{r.name}</span>
                      <span className="text-muted-foreground" style={{ fontSize: 13 }}>{r.main}</span>
                    </div>
                    <span className="num">¥{fmtMoney(r.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${r.value / max * 100}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>分类支出排行 · <span className="mono text-muted-foreground" style={{ fontSize: 14 }}>{month}</span></DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1">
                {data.ranking.map((r, i) => {
                  const color = MAIN_CATEGORIES.indexOf(r.main as any) === 0 ? "var(--chart-1)" : MAIN_CATEGORIES.indexOf(r.main as any) === 1 ? "var(--chart-2)" : "var(--chart-3)";
                  return (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="num text-muted-foreground" style={{ fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</span>
                          <span>{r.name}</span>
                          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{r.main}</span>
                        </div>
                        <span className="num">¥{fmtMoney(r.value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${r.value / max * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
                {data.ranking.length === 0 && <div className="text-muted-foreground py-8 text-center">暂无数据</div>}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3>最近账单</h3>
          <span className="tracking-[0.2em] uppercase text-muted-foreground" style={{ fontSize: 12 }}>Recent</span>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>分类</TableHead><TableHead>付款人</TableHead>
            <TableHead>备注</TableHead><TableHead className="text-right">金额</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.recent.map(r => {
              const c = db.categories.find(c => c.id === r.subCategoryId);
              const u = db.users.find(u => u.id === r.userId);
              return (
                <TableRow key={r.id}>
                  <TableCell className="mono">{r.date}</TableCell>
                  <TableCell>{c?.name} <span className="text-muted-foreground">· {c?.main}</span></TableCell>
                  <TableCell>{u?.username}</TableCell>
                  <TableCell className="text-muted-foreground">{r.note || "—"}</TableCell>
                  <TableCell className="text-right num">¥{fmtMoney(r.amount)}</TableCell>
                </TableRow>
              );
            })}
            {data.recent.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无账单</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
