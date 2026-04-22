import { useMemo, useState } from "react";
import { useStore, fmtMoney, Record as R } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { QuickAdd } from "../QuickAdd";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export function Records() {
  const { db, actions } = useStore();
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [user, setUser] = useState("all"); const [main, setMain] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<R | undefined>();

  const list = useMemo(() => db.records.filter(r => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (user !== "all" && r.userId !== user) return false;
    if (main !== "all") {
      const c = db.categories.find(c => c.id === r.subCategoryId);
      if (c?.main !== main) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date)), [db, from, to, user, main]);

  const total = list.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <PageHeader title="记账记录" subtitle="Records" right={
        <Button onClick={() => { setEditing(undefined); setOpen(true); }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus size={16} /> 新增记账
        </Button>
      } />

      <div className="p-4 rounded-lg border border-border bg-card mb-3 grid md:grid-cols-5 gap-3">
        <div className="space-y-1.5"><Label>起始日期</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>结束日期</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>付款人</Label>
          <Select value={user} onValueChange={setUser}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {db.users.filter(u => !u.isDeleted).map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>分类</Label>
          <Select value={main} onValueChange={setMain}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="干饭钱">干饭钱</SelectItem>
              <SelectItem value="潇洒钱">潇洒钱</SelectItem>
              <SelectItem value="其他钱">其他钱</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <div className="w-full p-2.5 rounded-md bg-muted">
            <div className="text-muted-foreground tracking-[0.2em] uppercase" style={{ fontSize: 12 }}>筛选后合计</div>
            <div className="num">¥{fmtMoney(total)} <span className="text-muted-foreground" style={{ fontSize: 14 }}>· {list.length}笔</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>分类</TableHead><TableHead>付款人</TableHead>
            <TableHead className="text-right">金额</TableHead><TableHead>备注</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.map(r => {
              const c = db.categories.find(c => c.id === r.subCategoryId);
              const u = db.users.find(u => u.id === r.userId);
              return (
                <TableRow key={r.id}>
                  <TableCell className="mono">{r.date}</TableCell>
                  <TableCell>{c?.name} <span className="text-muted-foreground" style={{ fontSize: 14 }}>· {c?.main}</span></TableCell>
                  <TableCell>{u?.username}</TableCell>
                  <TableCell className="text-right num">¥{fmtMoney(r.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.note || "—"}</TableCell>
                  <TableCell className="text-right">
                    <button className="p-1.5 hover:text-accent" onClick={() => { setEditing(r); setOpen(true); }}><Pencil size={14} /></button>
                    <button className="p-1.5 hover:text-destructive" onClick={async () => {
                      if (!confirm("删除该记录？")) return;
                      try {
                        await actions.deleteRecord(r.id);
                        toast.success("已删除");
                      } catch (error: any) {
                        toast.error(error.message || "删除失败");
                      }
                    }}><Trash2 size={14} /></button>
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">无记录</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <QuickAdd open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
