import { useState } from "react";
import { useStore, genId, User } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Pencil, Trash2, Plus, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function Users() {
  const { db, setDB, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [username, setU] = useState(""); const [password, setP] = useState("");
  const [show, setShow] = useState<{ [k: string]: boolean }>({});

  const openNew = () => { setEdit(null); setU(""); setP(""); setOpen(true); };
  const openEdit = (u: User) => { setEdit(u); setU(u.username); setP(u.password); setOpen(true); };

  const submit = () => {
    if (!username || !password) return toast.error("请填写完整");
    if (edit) setDB(d => ({ ...d, users: d.users.map(u => u.id === edit.id ? { ...u, username, password } : u) }));
    else setDB(d => ({ ...d, users: [...d.users, { id: genId(), username, password }] }));
    setOpen(false); toast.success("已保存");
  };

  return (
    <div>
      <PageHeader title="用户管理" subtitle="Users" right={
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增成员</Button>
      } />
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>用户名</TableHead><TableHead>密码</TableHead><TableHead>角色</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {db.users.map(u => {
              const canDelete = !u.isAdmin;
              return (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-2">
                    {u.username}
                    {u.id === currentUser?.id && <span className="tracking-[0.2em] uppercase text-accent" style={{ fontSize: 12 }}>本人</span>}
                  </TableCell>
                  <TableCell>
                    <span className="mono">{show[u.id] ? u.password : "••••••"}</span>
                    <button className="ml-2 text-muted-foreground hover:text-foreground" onClick={() => setShow(s => ({ ...s, [u.id]: !s[u.id] }))}>
                      {show[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </TableCell>
                  <TableCell>
                    {u.isAdmin
                      ? <span className="inline-flex items-center gap-1 text-accent"><ShieldCheck size={14} /> 管理员</span>
                      : <span className="text-muted-foreground">成员</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="p-1.5 hover:text-accent" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                    <button className={`p-1.5 ${canDelete ? "hover:text-destructive" : "opacity-30 cursor-not-allowed"}`}
                      disabled={!canDelete}
                      onClick={() => { if (!canDelete) return; if (confirm("删除？")) setDB(d => ({ ...d, users: d.users.filter(x => x.id !== u.id) })); }}>
                      <Trash2 size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "编辑" : "新增"}成员</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>用户名</Label><Input value={username} onChange={e => setU(e.target.value)} /></div>
            <div className="space-y-2"><Label>密码</Label><Input value={password} onChange={e => setP(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
