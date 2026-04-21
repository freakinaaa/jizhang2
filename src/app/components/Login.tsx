import { useState } from "react";
import { useStore } from "../store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

export function Login() {
  const { db, setDB } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setU] = useState("");
  const [password, setP] = useState("");

  const submit = () => {
    if (!username || !password) { toast.error("请输入用户名与密码"); return; }
    if (mode === "login") {
      const u = db.users.find(x => x.username === username && x.password === password);
      if (!u) { toast.error("用户名或密码错误"); return; }
      setDB(d => ({ ...d, currentUserId: u.id }));
    } else {
      if (db.users.some(x => x.username === username)) { toast.error("用户名已存在"); return; }
      const id = Math.random().toString(36).slice(2, 10);
      setDB(d => ({ ...d, users: [...d.users, { id, username, password }], currentUserId: id }));
      toast.success("注册成功");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            "radial-gradient(circle at 85% 15%, rgba(196,92,46,0.30), transparent 45%)",
            "radial-gradient(circle at 10% 90%, rgba(215,157,90,0.18), transparent 50%)",
            "radial-gradient(circle at 50% 50%, rgba(107,142,123,0.10), transparent 60%)",
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.055) 1px, transparent 0)",
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          ].join(","),
          backgroundSize: "auto, auto, auto, 64px 64px, 64px 64px, 22px 22px, 180px 180px",
          maskImage: "radial-gradient(ellipse 120% 95% at 50% 40%, #000 55%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 120% 95% at 50% 40%, #000 55%, transparent 100%)",
        }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(196,92,46,0.55), transparent)" }} />
          <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)" }} />
          <div className="absolute" style={{ top: "14%", right: "12%", width: 140, height: 140, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div className="absolute" style={{ top: "11%", right: "9%", width: 200, height: 200, border: "1px solid rgba(196,92,46,0.22)", borderRadius: "50%" }} />
          <div className="absolute" style={{ bottom: "22%", left: "10%", width: 80, height: 80, border: "1px dashed rgba(215,157,90,0.25)", borderRadius: 4, transform: "rotate(12deg)" }} />
          <div className="absolute italic" style={{ top: "10%", left: "44%", fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(196,92,46,0.55)", letterSpacing: "0.02em" }}>no.01</div>
          <div className="absolute tracking-[0.5em] uppercase" style={{ bottom: "4%", right: "8%", fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-mono)" }}>✦ MMXXVI</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sidebar-foreground/60 tracking-[0.3em] uppercase" style={{ fontSize: 13 }}>
            <span className="h-px w-8 bg-sidebar-foreground/40" /> Ledger / 账本
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 1, letterSpacing: "-0.03em" }}>
            记一笔，<br/>
            <span className="italic" style={{ color: "var(--accent)" }}>看得清。</span>
          </div>
          <p className="max-w-md text-sidebar-foreground/70 leading-relaxed">
            把每一笔支出、分期、还款与会钱，安放在一处。像记一本朴素的笔记，也像翻阅一本温热的账簿。
          </p>
        </div>
        <div className="relative z-10 flex items-end justify-between text-sidebar-foreground/50" style={{ fontSize: 13 }}>
          <span>EST. 2026</span>
          <span className="tracking-[0.3em] uppercase">Private · Offline</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="tracking-[0.25em] uppercase text-muted-foreground" style={{ fontSize: 13 }}>
              {mode === "login" ? "欢迎回来" : "加入记录"}
            </div>
            <h1>{mode === "login" ? "登录账户" : "创建账户"}</h1>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={username} onChange={e => setU(e.target.value)} placeholder="admin" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input type="password" value={password} onChange={e => setP(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>
              {mode === "login" ? "登 录" : "注 册"}
            </Button>
            <button className="w-full text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "没有账户？去注册" : "已有账户？去登录"}
            </button>
          </div>
          <div className="pt-6 border-t border-border text-muted-foreground" style={{ fontSize: 14 }}>
            测试账户：<span className="mono">admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
