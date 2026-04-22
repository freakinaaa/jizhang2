import { useState } from "react";
import { useStore, User } from "../../store";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, Pencil, Trash2, Plus, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

export function Users() {
  const { db, actions, currentUser } = useStore();
  const isAdmin = !!currentUser?.isAdmin;
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const resetPasswordState = () => {
    setP("");
    setPasswordConfirm("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const openNew = () => { setEdit(null); setU(""); resetPasswordState(); setOpen(true); };
  const openEdit = (u: User) => { setEdit(u); setU(u.username); resetPasswordState(); setOpen(true); };

  const submit = async () => {
    const willChangePassword = !!password || !!passwordConfirm;
    if (!username.trim()) return toast.error("请填写用户名");
    if (!edit && !password) return toast.error("请填写密码");
    if (!edit && !passwordConfirm) return toast.error("请再次输入密码");
    if (edit && willChangePassword && (!password || !passwordConfirm)) return toast.error("请完整填写两次密码");
    if ((!edit || willChangePassword) && password !== passwordConfirm) return toast.error("两次输入的密码不一致");
    if (!edit && !isAdmin) return toast.error("仅管理员可新增成员");
    if (edit && !isAdmin && edit.id !== currentUser?.id) return toast.error("无权限");
    try {
      await actions.saveUser({ id: edit?.id, username: username.trim(), password: password || undefined, passwordConfirm: passwordConfirm || undefined });
      setOpen(false); toast.success("已保存");
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    }
  };

  return (
    <div>
      <PageHeader title="用户管理" subtitle="Users" right={
        isAdmin
          ? <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.open("/api/admin/backup", "_blank")}><Download size={16} /> 下载备份</Button>
              <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus size={16} /> 新增成员</Button>
            </div>
          : <span className="text-muted-foreground" style={{ fontSize: 13 }}>仅管理员可新增</span>
      } />
      <div className="p-4 rounded-lg border border-border bg-card mb-3 flex items-center justify-between">
        <div>
          <div style={{ fontSize: 15 }}>开放注册</div>
          <div className="text-muted-foreground" style={{ fontSize: 13 }}>
            {isAdmin
              ? (db.openRegistration ? "当前允许新用户在登录页自助注册" : "仅管理员可在此页新增成员")
              : "仅管理员可修改此设置"}
          </div>
        </div>
        <Switch checked={!!db.openRegistration} disabled={!isAdmin} onCheckedChange={async v => {
          try { await actions.setOpenRegistration(v); }
          catch (error: any) { toast.error(error.message || "保存失败"); }
        }} />
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>用户名</TableHead><TableHead>密码</TableHead><TableHead>角色</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {db.users.filter(u => !u.isDeleted).map(u => {
              const canDelete = isAdmin && !u.isAdmin;
              const canEdit = isAdmin || u.id === currentUser?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-2">
                    {u.username}
                    {u.id === currentUser?.id && <span className="tracking-[0.2em] uppercase text-accent" style={{ fontSize: 12 }}>本人</span>}
                  </TableCell>
                  <TableCell>
                    <span className="mono text-muted-foreground">{isAdmin ? "已加密，可重置" : "已隐藏"}</span>
                  </TableCell>
                  <TableCell>
                    {u.isAdmin
                      ? <span className="inline-flex items-center gap-1 text-accent"><ShieldCheck size={14} /> 管理员</span>
                      : <span className="text-muted-foreground">成员</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className={`p-1.5 ${canEdit ? "hover:text-accent" : "opacity-30 cursor-not-allowed"}`} disabled={!canEdit} onClick={() => { if (canEdit) openEdit(u); }}><Pencil size={14} /></button>
                    <button className={`p-1.5 ${canDelete ? "hover:text-destructive" : "opacity-30 cursor-not-allowed"}`}
                      disabled={!canDelete}
                      onClick={async () => {
                        if (!canDelete) return;
                        if (!confirm("删除？")) return;
                        try { await actions.deleteUser(u.id); }
                        catch (error: any) { toast.error(error.message || "删除失败"); }
                      }}>
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
          <DialogHeader><DialogTitle>{edit ? "编辑成员 / 重置密码" : "新增成员"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>用户名</Label><Input value={username} onChange={e => setU(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{edit ? "新密码（留空则不修改）" : "密码"}</Label>
              <div className="relative">
                <Input className="pr-10" type={showPassword ? "text" : "password"} value={password} onChange={e => setP(e.target.value)} />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{edit ? "确认新密码" : "确认密码"}</Label>
              <div className="relative">
                <Input className="pr-10" type={showPasswordConfirm ? "text" : "password"} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswordConfirm(v => !v)}
                  aria-label={showPasswordConfirm ? "隐藏确认密码" : "显示确认密码"}
                >
                  {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {edit && <div className="text-muted-foreground" style={{ fontSize: 12 }}>不修改密码时，两项都留空。</div>}
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
