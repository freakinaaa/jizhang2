import { useState } from "react";
import { useStore, genId, fmtMoney, Installment } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export function Installments() {
  const { db, setDB } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Installment | null>(null);
  const [userId, setUserId] = useState(""); const [amount, setAmount] = useState("");
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const [platform, setPlatform] = useState("");

  const openNew = () => { setEdit(null); setUserId(db.users[0]?.id ?? ""); setAmount(""); setStart(""); setEnd(""); setPlatform(""); setOpen(true); };
  const openEdit = (i: Installment) => { setEdit(i); setUserId(i.userId); setAmount(String(i.amount)); setStart(i.start); setEnd(i.end); setPlatform(i.platform); setOpen(true); };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!userId || !amt || !start || !end || !platform) return toast.error("请完整填写");
    if (edit) {
      setDB(d => ({ ...d, installments: d.installments.map(i => i.id === edit.id ? { ...i, userId, amount: amt, start, end, platform } : i) }));
    } else {
      setDB(d => ({ ...d, installments: [{ id: genId(), userId, amount: amt, start, end, platform }, ...d.installments] }));
    }
    setOpen(false); toast.success("已保存");
  };

  return (
    <div>
      <PageHeader title="分期费用管理" subtitle="Installments" right={
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增分期</Button>
      } />
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>分期用户</TableHead><TableHead className="text-right">分期费用</TableHead>
            <TableHead>开始</TableHead><TableHead>结束</TableHead><TableHead>平台</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {db.installments.map(i => (
              <TableRow key={i.id}>
                <TableCell>{db.users.find(u => u.id === i.userId)?.username}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(i.amount)}</TableCell>
                <TableCell className="mono">{i.start}</TableCell>
                <TableCell className="mono">{i.end}</TableCell>
                <TableCell>{i.platform}</TableCell>
                <TableCell className="text-right">
                  <button className="p-1.5 hover:text-accent" onClick={() => openEdit(i)}><Pencil size={14} /></button>
                  <button className="p-1.5 hover:text-destructive" onClick={() => { if (confirm("删除？")) setDB(d => ({ ...d, installments: d.installments.filter(x => x.id !== i.id) })); }}><Trash2 size={14} /></button>
                </TableCell>
              </TableRow>
            ))}
            {db.installments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">暂无分期</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "编辑" : "新增"}分期</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>分期用户</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>{db.users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>分期费用（每月）</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>开始时间</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>结束时间</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>分期平台</Label><Input value={platform} onChange={e => setPlatform(e.target.value)} placeholder="花呗/信用卡..." /></div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
