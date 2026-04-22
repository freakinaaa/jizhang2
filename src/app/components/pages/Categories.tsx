import { useState } from "react";
import { useStore, MainCategory, SubCategory } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

export function Categories() {
  const { db, actions } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<SubCategory | null>(null);
  const [name, setName] = useState("");
  const [main, setMain] = useState<MainCategory>("干饭钱");

  const openNew = () => { setEdit(null); setName(""); setMain("干饭钱"); setOpen(true); };
  const openEdit = (c: SubCategory) => { setEdit(c); setName(c.name); setMain(c.main); setOpen(true); };

  const submit = async () => {
    if (!name.trim()) return toast.error("请输入名称");
    try {
      await actions.saveCategory({ id: edit?.id, name, main });
      setOpen(false); toast.success("已保存");
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    }
  };

  return (
    <div>
      <PageHeader title="分类管理" subtitle="Categories" right={
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增子类</Button>
      } />

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        {(["干饭钱", "潇洒钱", "其他钱"] as MainCategory[]).map((m, i) => (
          <div key={m} className="p-5 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full" style={{ background: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"][i] }} />
              <h4>{m}</h4>
              <Lock size={12} className="ml-auto text-muted-foreground" />
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 14 }}>固定大类，不可修改</div>
            <div className="num text-muted-foreground mt-2" style={{ fontSize: 14 }}>{db.categories.filter(c => c.main === m && !c.isDeleted).length} 个子类</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>子类名称</TableHead><TableHead>所属大类</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {db.categories.filter(c => !c.isDeleted).map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.main}</TableCell>
                <TableCell className="text-right">
                  <button className="p-1.5 hover:text-accent" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                  <button className="p-1.5 hover:text-destructive" onClick={async () => {
                    if (!confirm("删除？")) return;
                    try { await actions.deleteCategory(c.id); }
                    catch (error: any) { toast.error(error.message || "删除失败"); }
                  }}><Trash2 size={14} /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "编辑" : "新增"}子类</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>子类名称</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>所属大类</Label>
              <Select value={main} onValueChange={(v: any) => setMain(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="干饭钱">干饭钱</SelectItem>
                  <SelectItem value="潇洒钱">潇洒钱</SelectItem>
                  <SelectItem value="其他钱">其他钱</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
