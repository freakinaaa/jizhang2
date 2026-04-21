import { useState } from "react";
import { useStore, genId, fmtMoney, Hui as H, HuiItem } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

function buildItems(start: string, end: string, principal: number, prev?: HuiItem[]): HuiItem[] {
  const out: HuiItem[] = [];
  const [sy, sm] = start.slice(0, 7).split("-").map(Number);
  const [ey, em] = end.slice(0, 7).split("-").map(Number);
  let y = sy, m = sm;
  const diff = (ey - sy) * 12 + (em - sm);
  for (let k = 0; k < diff; k++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const old = prev?.find(i => i.month === key);
    out.push({ month: key, principal, interest: old?.interest ?? 0 });
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

export function Hui() {
  const { db, setDB } = useStore();
  const [active, setActive] = useState<string | null>(db.huis[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<H | null>(null);
  const [name, setName] = useState(""); const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [principal, setPr] = useState("");

  const current = db.huis.find(h => h.id === active) ?? db.huis[0] ?? null;

  const openNew = () => { setEdit(null); setName(""); setStart(""); setEnd(""); setPr(""); setOpen(true); };
  const openEdit = () => { if (!current) return; setEdit(current); setName(current.name); setStart(current.start); setEnd(current.end); setPr(String(current.principal)); setOpen(true); };

  const submit = () => {
    const p = +principal || 0;
    if (!name || !start || !end || !p) return toast.error("请完整填写");
    if (edit) {
      const items = buildItems(start, end, p, edit.items);
      setDB(d => ({ ...d, huis: d.huis.map(h => h.id === edit.id ? { ...h, name, start, end, principal: p, items } : h) }));
    } else {
      const id = genId();
      setDB(d => ({ ...d, huis: [...d.huis, { id, name, start, end, principal: p, items: buildItems(start, end, p) }] }));
      setActive(id);
    }
    setOpen(false); toast.success("已保存");
  };

  const delHui = () => {
    if (!current || !confirm("删除该会钱？")) return;
    setDB(d => ({ ...d, huis: d.huis.filter(h => h.id !== current.id) }));
    setActive(db.huis.filter(h => h.id !== current.id)[0]?.id ?? null);
  };

  const updateInterest = (month: string, v: string) => {
    if (!current) return;
    setDB(d => ({ ...d, huis: d.huis.map(h => h.id === current.id ? { ...h, items: h.items.map(i => i.month === month ? { ...i, interest: +v || 0 } : i) } : h) }));
  };

  const total = current ? current.items.reduce((s, i) => s + i.principal + i.interest, 0) : 0;

  return (
    <div>
      <PageHeader title="会钱管理" subtitle="Hui" right={
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增会钱</Button>
      } />

      <div className="border-b border-border flex items-center gap-1 mb-4 overflow-x-auto">
        {db.huis.map(h => (
          <button key={h.id} onClick={() => setActive(h.id)}
            className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${active === h.id ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {h.name}
          </button>
        ))}
        {db.huis.length === 0 && <div className="py-4 text-muted-foreground">暂无会钱，点右上角新增</div>}
      </div>

      {current && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3>{current.name}</h3>
              <div className="text-muted-foreground mono" style={{ fontSize: 14 }}>{current.start} → {current.end} · 本金 ¥{fmtMoney(current.principal)}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-md bg-muted">
                <span className="tracking-[0.2em] uppercase text-muted-foreground mr-2" style={{ fontSize: 12 }}>合计</span>
                <span className="num">¥{fmtMoney(total)}</span>
              </div>
              <Button variant="outline" onClick={openEdit}><Pencil size={14} /> 编辑</Button>
              <Button variant="outline" onClick={delHui} className="text-destructive"><Trash2 size={14} /> 删除</Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>日期</TableHead><TableHead className="text-right">本金</TableHead>
                <TableHead className="text-right">利息（可编辑）</TableHead><TableHead className="text-right">小计</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {current.items.map(i => (
                  <TableRow key={i.month}>
                    <TableCell className="mono">{i.month}</TableCell>
                    <TableCell className="text-right num">¥{fmtMoney(i.principal)}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" step="0.01" className="num text-right w-32 ml-auto" value={i.interest} onChange={e => updateInterest(i.month, e.target.value)} />
                    </TableCell>
                    <TableCell className="text-right num">¥{fmtMoney(i.principal + i.interest)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "编辑" : "新增"}会钱</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>会钱名称</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>开始日期</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>结束日期</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>本金</Label><Input type="number" className="num" value={principal} onChange={e => setPr(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
