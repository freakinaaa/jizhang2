import { useState } from "react";
import { useStore, genId, fmtMoney, getMonth, Repayment } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus, Settings, X } from "lucide-react";
import { toast } from "sonner";

export function Repayments() {
  const { db, setDB, currentUser } = useStore();
  const [cfg, setCfg] = useState(false);
  const [newPlat, setNewPlat] = useState("");
  const [editPlat, setEditPlat] = useState<string | null>(null);
  const [editPlatName, setEditPlatName] = useState("");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Repayment | null>(null);
  const [month, setMonth] = useState(getMonth());
  const [userId, setUserId] = useState(currentUser?.id ?? "");
  const [items, setItems] = useState<{ [k: string]: string }>({});

  const openNew = () => {
    setEdit(null); setMonth(getMonth()); setUserId(currentUser?.id ?? "");
    setItems(Object.fromEntries(db.platforms.map(p => [p.id, ""]))); setOpen(true);
  };
  const openEdit = (r: Repayment) => {
    setEdit(r); setMonth(r.month); setUserId(r.userId);
    const m: any = {}; db.platforms.forEach(p => m[p.id] = String(r.items.find(i => i.platformId === p.id)?.amount ?? ""));
    setItems(m); setOpen(true);
  };

  const total = Object.values(items).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const submit = () => {
    const payload: Repayment = {
      id: edit?.id ?? genId(), month, userId,
      items: db.platforms.map(p => ({ platformId: p.id, amount: parseFloat(items[p.id]) || 0 })).filter(i => i.amount > 0),
    };
    if (edit) setDB(d => ({ ...d, repayments: d.repayments.map(r => r.id === edit.id ? payload : r) }));
    else setDB(d => ({ ...d, repayments: [payload, ...d.repayments] }));
    setOpen(false); toast.success("已保存");
  };

  return (
    <div>
      <PageHeader title="还款管理" subtitle="Repayments" right={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCfg(true)}><Settings size={16} /> 配置平台</Button>
          <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增还款</Button>
        </div>
      } />
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>还款月份</TableHead><TableHead className="text-right">总费用</TableHead><TableHead>还款人</TableHead><TableHead>明细</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {db.repayments.map(r => {
              const tot = r.items.reduce((s, i) => s + i.amount, 0);
              return (
                <TableRow key={r.id}>
                  <TableCell className="mono">{r.month}</TableCell>
                  <TableCell className="text-right num">¥{fmtMoney(tot)}</TableCell>
                  <TableCell>{db.users.find(u => u.id === r.userId)?.username}</TableCell>
                  <TableCell className="text-muted-foreground" style={{ fontSize: 14 }}>
                    {r.items.map(i => `${db.platforms.find(p => p.id === i.platformId)?.name ?? "?"} ¥${fmtMoney(i.amount)}`).join(" · ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="p-1.5 hover:text-accent" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="p-1.5 hover:text-destructive" onClick={() => { if (confirm("删除？")) setDB(d => ({ ...d, repayments: d.repayments.filter(x => x.id !== r.id) })); }}><Trash2 size={14} /></button>
                  </TableCell>
                </TableRow>
              );
            })}
            {db.repayments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">暂无</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={cfg} onOpenChange={setCfg}>
        <DialogContent>
          <DialogHeader><DialogTitle>配置还款平台</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={newPlat} onChange={e => setNewPlat(e.target.value)} placeholder="新平台名称" />
              <Button onClick={() => { if (!newPlat) return; setDB(d => ({ ...d, platforms: [...d.platforms, { id: genId(), name: newPlat }] })); setNewPlat(""); }}>添加</Button>
            </div>
            <div className="space-y-2">
              {db.platforms.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-md border border-border">
                  {editPlat === p.id
                    ? <Input value={editPlatName} onChange={e => setEditPlatName(e.target.value)} />
                    : <span className="flex-1">{p.name}</span>}
                  {editPlat === p.id
                    ? <Button size="sm" onClick={() => { setDB(d => ({ ...d, platforms: d.platforms.map(x => x.id === p.id ? { ...x, name: editPlatName } : x) })); setEditPlat(null); }}>保存</Button>
                    : <button className="p-1.5 hover:text-accent" onClick={() => { setEditPlat(p.id); setEditPlatName(p.name); }}><Pencil size={14} /></button>}
                  <button className="p-1.5 hover:text-destructive" onClick={() => { if (confirm("删除平台？")) setDB(d => ({ ...d, platforms: d.platforms.filter(x => x.id !== p.id) })); }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "编辑" : "新增"}还款</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>月份</Label><Input type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
              <div className="space-y-2"><Label>还款人</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{db.users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>各平台还款</Label>
              {db.platforms.length === 0 && <div className="text-muted-foreground" style={{ fontSize: 14 }}>请先配置平台</div>}
              {db.platforms.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-muted-foreground">{p.name}</span>
                  <Input type="number" className="num" value={items[p.id] ?? ""} onChange={e => setItems({ ...items, [p.id]: e.target.value })} placeholder="0.00" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted">
              <span className="tracking-[0.2em] uppercase text-muted-foreground" style={{ fontSize: 12 }}>还款总额</span>
              <span className="num">¥{fmtMoney(total)}</span>
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
