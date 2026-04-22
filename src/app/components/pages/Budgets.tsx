import { useState } from "react";
import { useStore, fmtMoney, getMonth } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export function Budgets() {
  const { db, setDB } = useStore();
  const month = getMonth();
  const existing = db.budgets.find(b => b.month === month);
  const [total, setTotal] = useState(String(existing?.total ?? ""));
  const [ganfan, setG] = useState(String(existing?.ganfan ?? ""));
  const [xiaosa, setX] = useState(String(existing?.xiaosa ?? ""));
  const [other, setO] = useState(String(existing?.other ?? ""));

  const [editMonth, setEditMonth] = useState<string | null>(null);

  const save = () => {
    const p = { month, total: +total || 0, ganfan: +ganfan || 0, xiaosa: +xiaosa || 0, other: +other || 0 };
    setDB(d => {
      const ex = d.budgets.find(b => b.month === month);
      return { ...d, budgets: ex ? d.budgets.map(b => b.month === month ? p : b) : [...d.budgets, p] };
    });
    toast.success("已保存");
  };

  return (
    <div>
      <PageHeader title="预算管理" subtitle="Budgets" />
      <div className="p-6 rounded-lg border border-border bg-card mb-3">
        <div className="flex items-baseline gap-3 mb-4">
          <h3>本月预算设置</h3>
          <span className="mono text-muted-foreground" style={{ fontSize: 14 }}>{month}</span>
        </div>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <div className="space-y-2"><Label>总预算</Label><Input type="number" className="num" value={total} onChange={e => setTotal(e.target.value)} /></div>
          <div className="space-y-2"><Label>干饭钱</Label><Input type="number" className="num" value={ganfan} onChange={e => setG(e.target.value)} /></div>
          <div className="space-y-2"><Label>潇洒钱</Label><Input type="number" className="num" value={xiaosa} onChange={e => setX(e.target.value)} /></div>
          <div className="space-y-2"><Label>其他钱</Label><Input type="number" className="num" value={other} onChange={e => setO(e.target.value)} /></div>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={save}>保存</Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>月份</TableHead><TableHead className="text-right">总预算</TableHead>
            <TableHead className="text-right">干饭钱</TableHead><TableHead className="text-right">潇洒钱</TableHead>
            <TableHead className="text-right">其他钱</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {[...db.budgets].sort((a, b) => b.month.localeCompare(a.month)).map(b => (
              <TableRow key={b.month} className={b.month === month ? "" : "opacity-50"}>
                <TableCell className="mono">{b.month}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(b.total)}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(b.ganfan)}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(b.xiaosa)}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(b.other)}</TableCell>
                <TableCell className="text-right">
                  {b.month === month
                    ? <button className="p-1.5 hover:text-accent" onClick={() => { setTotal(String(b.total)); setG(String(b.ganfan)); setX(String(b.xiaosa)); setO(String(b.other)); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={14} /></button>
                    : <span className="text-muted-foreground" style={{ fontSize: 13 }}>仅当月可编辑</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
