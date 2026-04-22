import { useState } from "react";
import { useStore, fmtMoney, Installment } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

export function Installments() {
  const { db, actions } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Installment | null>(null);
  const [userId, setUserId] = useState(""); const [amount, setAmount] = useState("");
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const [platform, setPlatform] = useState("");
  const [cfg, setCfg] = useState(false);
  const [newPlat, setNewPlat] = useState("");
  const [editPlat, setEditPlat] = useState<string | null>(null);
  const [editPlatName, setEditPlatName] = useState("");
  const [fUser, setFUser] = useState("all");
  const [fPlat, setFPlat] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const openNew = () => { setEdit(null); setUserId(db.users[0]?.id ?? ""); setAmount(""); setStart(""); setEnd(""); setPlatform(""); setOpen(true); };
  const openEdit = (i: Installment) => { setEdit(i); setUserId(i.userId); setAmount(String(i.amount)); setStart(i.start); setEnd(i.end); setPlatform(i.platform); setOpen(true); };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!userId || !amt || !start || !end || !platform) return toast.error("请完整填写");
    try {
      await actions.saveInstallment({ id: edit?.id, userId, amount: amt, start, end, platform });
      setOpen(false); toast.success("已保存");
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    }
  };

  return (
    <div>
      <PageHeader title="分期费用管理" subtitle="Installments" right={
        <div className="flex items-center gap-3">
          {(() => {
            const m = new Date().toISOString().slice(0, 7);
            const active = db.installments.filter(i => i.start.slice(0, 7) <= m && i.end.slice(0, 7) >= m);
            const sum = active.reduce((s, i) => s + i.amount, 0);
            return (
              <div className="px-3 py-2 rounded-md bg-muted">
                <span className="tracking-[0.2em] uppercase text-muted-foreground mr-2" style={{ fontSize: 12 }}>当月分期</span>
                <span className="num">¥{fmtMoney(sum)}</span>
                <span className="text-muted-foreground ml-2" style={{ fontSize: 13 }}>· {active.length}笔</span>
              </div>
            );
          })()}
          <Button variant="outline" onClick={() => setCfg(true)}><Settings size={16} /> 配置平台</Button>
          <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增分期</Button>
        </div>
      } />
      <div className="p-4 rounded-lg border border-border bg-card mb-3 grid md:grid-cols-3 gap-3">
        <div className="space-y-1.5"><Label>分期用户</Label>
          <Select value={fUser} onValueChange={setFUser}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {db.users.filter(u => !u.isDeleted).map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>平台</Label>
          <Select value={fPlat} onValueChange={setFPlat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {db.installmentPlatforms.filter(p => !p.isDeleted).map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>状态</Label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">进行中</SelectItem>
              <SelectItem value="ended">已结束</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>分期用户</TableHead><TableHead className="text-right">分期费用</TableHead>
            <TableHead>开始</TableHead><TableHead>结束</TableHead><TableHead>平台</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(() => {
              const todayS = new Date().toISOString().slice(0, 10);
              const filtered = db.installments.filter(i => {
                if (fUser !== "all" && i.userId !== fUser) return false;
                if (fPlat !== "all" && i.platform !== fPlat) return false;
                const act = i.start <= todayS && i.end >= todayS;
                if (fStatus === "active" && !act) return false;
                if (fStatus === "ended" && act) return false;
                return true;
              }).sort((a, b) => b.start.localeCompare(a.start));
              if (filtered.length === 0) return <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">无记录</TableCell></TableRow>;
              return filtered.map(i => {
              const today = new Date().toISOString().slice(0, 10);
              const active = i.start <= today && i.end >= today;
              return (
              <TableRow key={i.id} className={active ? "" : "opacity-50"}>
                <TableCell>{db.users.find(u => u.id === i.userId)?.username}</TableCell>
                <TableCell className="text-right num">¥{fmtMoney(i.amount)}</TableCell>
                <TableCell className="mono">{i.start}</TableCell>
                <TableCell className="mono">{i.end}</TableCell>
                <TableCell>{i.platform}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full tracking-[0.1em] ${active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`} style={{ fontSize: 12 }}>
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-muted-foreground/50"}`} />
                    {active ? "进行中" : "已结束"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <button className="p-1.5 hover:text-accent" onClick={() => openEdit(i)}><Pencil size={14} /></button>
                  <button className="p-1.5 hover:text-destructive" onClick={async () => {
                    if (!confirm("删除？")) return;
                    try { await actions.deleteInstallment(i.id); }
                    catch (error: any) { toast.error(error.message || "删除失败"); }
                  }}><Trash2 size={14} /></button>
                </TableCell>
              </TableRow>
              );
            });
            })()}
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
                <SelectContent>{db.users.filter(u => !u.isDeleted).map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>分期费用（每月）</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>开始时间</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>结束时间</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>分期平台</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="选择分期平台" /></SelectTrigger>
                <SelectContent>{db.installmentPlatforms.filter(p => !p.isDeleted).map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cfg} onOpenChange={setCfg}>
        <DialogContent>
          <DialogHeader><DialogTitle>配置分期平台</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={newPlat} onChange={e => setNewPlat(e.target.value)} placeholder="新平台名称" />
              <Button onClick={async () => {
                if (!newPlat) return;
                try { await actions.saveInstallmentPlatform({ name: newPlat }); setNewPlat(""); }
                catch (error: any) { toast.error(error.message || "添加失败"); }
              }}>添加</Button>
            </div>
            <div className="space-y-2">
              {db.installmentPlatforms.filter(p => !p.isDeleted).map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-md border border-border">
                  {editPlat === p.id
                    ? <Input value={editPlatName} onChange={e => setEditPlatName(e.target.value)} />
                    : <span className="flex-1">{p.name}</span>}
                  {editPlat === p.id
                    ? <Button size="sm" onClick={async () => {
                        try { await actions.saveInstallmentPlatform({ id: p.id, name: editPlatName }); setEditPlat(null); }
                        catch (error: any) { toast.error(error.message || "保存失败"); }
                      }}>保存</Button>
                    : <button className="p-1.5 hover:text-accent" onClick={() => { setEditPlat(p.id); setEditPlatName(p.name); }}><Pencil size={14} /></button>}
                  <button className="p-1.5 hover:text-destructive" onClick={async () => {
                    if (!confirm("删除平台？")) return;
                    try { await actions.deleteInstallmentPlatform(p.id); }
                    catch (error: any) { toast.error(error.message || "删除失败"); }
                  }}><Trash2 size={14} /></button>
                </div>
              ))}
              {db.installmentPlatforms.filter(p => !p.isDeleted).length === 0 && <div className="text-muted-foreground py-4 text-center" style={{ fontSize: 14 }}>暂无平台</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
