import { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <div className="tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontSize: 13 }}>
          <span className="inline-block h-px w-6 bg-accent align-middle mr-2" />{subtitle ?? "Ledger"}
        </div>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 550, fontVariationSettings: "'opsz' 72, 'SOFT' 40" }}>{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Stat({ label, value, accent, hint }: { label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className={`p-5 rounded-lg border ${accent ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border"}`}>
      <div className={`tracking-[0.2em] uppercase mb-3 ${accent ? "text-accent-foreground/70" : "text-muted-foreground"}`} style={{ fontSize: 12 }}>{label}</div>
      <div className="num num-lg" style={{ fontSize: 26, lineHeight: 1 }}>
        <span className={accent ? "text-accent-foreground/80" : "text-muted-foreground"} style={{ fontSize: 14, marginRight: 4 }}>¥</span>
        {value}
      </div>
      {hint && <div className={`mt-2 ${accent ? "text-accent-foreground/70" : "text-muted-foreground"}`} style={{ fontSize: 14 }}>{hint}</div>}
    </div>
  );
}
