import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useStore, genId, getToday, Record as R } from "../store";
import { toast } from "sonner";

export function QuickAdd({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: R }) {
  const { db, setDB, currentUser } = useStore();
  const [date, setDate] = useState(getToday());
  const [sub, setSub] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setDate(initial.date); setSub(initial.subCategoryId); setAmount(String(initial.amount)); setNote(initial.note ?? "");
      } else { reset(); }
    }
  }, [open, initial]);

  const reset = () => { setDate(getToday()); setSub(""); setAmount(""); setNote(""); };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!sub) return toast.error("请选择花费事项");
    if (!amt || amt <= 0) return toast.error("金额需大于 0");
    if (initial) {
      setDB(d => ({ ...d, records: d.records.map(r => r.id === initial.id ? { ...r, date, subCategoryId: sub, amount: amt, note } : r) }));
      toast.success("已更新");
    } else {
      const rec: R = { id: genId(), date, subCategoryId: sub, amount: amt, note, userId: currentUser!.id };
      setDB(d => ({ ...d, records: [rec, ...d.records] }));
      toast.success("已记账");
    }
    onOpenChange(false);
  };

  const grouped = ["干饭钱", "潇洒钱", "其他钱"].map(m => ({ main: m, subs: db.categories.filter(c => c.main === m) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "编辑记账" : "快速记账"}</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>日期</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>金额</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input type="number" step="0.01" className="pl-7 num" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>花费事项</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-md p-3 bg-input-background">
              {grouped.map(g => (
                <div key={g.main}>
                  <div className="tracking-[0.2em] uppercase text-muted-foreground mb-2" style={{ fontSize: 12 }}>{g.main}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.subs.map(s => {
                      const active = sub === s.id;
                      return (
                        <button key={s.id} onClick={() => setSub(s.id)}
                          className={`px-3 py-1.5 rounded-full border transition-all ${active ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-foreground/40"}`}
                          style={{ fontSize: 13 }}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label>备注</Label><Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="可选" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
            <Button variant="outline" onClick={reset}>重置</Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={submit}>确认</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
