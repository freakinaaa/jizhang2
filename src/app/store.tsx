import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type MainCategory = "干饭钱" | "潇洒钱" | "其他钱";
export const MAIN_CATEGORIES: MainCategory[] = ["干饭钱", "潇洒钱", "其他钱"];

export type SubCategory = { id: string; name: string; main: MainCategory };
export type User = { id: string; username: string; password: string; isAdmin?: boolean };
export type Record = {
  id: string; date: string; subCategoryId: string; userId: string;
  amount: number; note?: string;
};
export type Installment = {
  id: string; userId: string; amount: number; start: string; end: string; platform: string;
};
export type Platform = { id: string; name: string };
export type Repayment = {
  id: string; month: string; userId: string; items: { platformId: string; amount: number }[];
};
export type Budget = { month: string; total: number; ganfan: number; xiaosa: number; other: number };
export type HuiItem = { month: string; principal: number; interest: number };
export type Hui = { id: string; name: string; start: string; end: string; principal: number; items: HuiItem[] };

type DB = {
  users: User[];
  categories: SubCategory[];
  records: Record[];
  installments: Installment[];
  installmentPlatforms: Platform[];
  platforms: Platform[];
  repayments: Repayment[];
  budgets: Budget[];
  huis: Hui[];
  openRegistration?: boolean;
  currentUserId: string | null;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const todayMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const seed = (): DB => {
  const adminId = uid();
  const u2 = uid();
  const cats: SubCategory[] = [
    { id: uid(), name: "早餐", main: "干饭钱" },
    { id: uid(), name: "午餐", main: "干饭钱" },
    { id: uid(), name: "晚餐", main: "干饭钱" },
    { id: uid(), name: "外卖", main: "干饭钱" },
    { id: uid(), name: "咖啡奶茶", main: "潇洒钱" },
    { id: uid(), name: "购物", main: "潇洒钱" },
    { id: uid(), name: "娱乐", main: "潇洒钱" },
    { id: uid(), name: "旅游", main: "潇洒钱" },
    { id: uid(), name: "交通", main: "其他钱" },
    { id: uid(), name: "日用", main: "其他钱" },
    { id: uid(), name: "医疗", main: "其他钱" },
  ];
  const platforms: Platform[] = [
    { id: uid(), name: "花呗" },
    { id: uid(), name: "信用卡" },
    { id: uid(), name: "白条" },
  ];
  const month = todayMonth();
  const prev = (n: number) => {
    const d = new Date(); d.setMonth(d.getMonth() - n);
    return d.toISOString().slice(0, 10);
  };
  const records: Record[] = [
    { id: uid(), date: today(), subCategoryId: cats[1].id, userId: adminId, amount: 38, note: "同事聚餐" },
    { id: uid(), date: today(), subCategoryId: cats[4].id, userId: adminId, amount: 22, note: "拿铁" },
    { id: uid(), date: prev(1), subCategoryId: cats[5].id, userId: u2, amount: 299, note: "衣服" },
    { id: uid(), date: prev(3), subCategoryId: cats[8].id, userId: adminId, amount: 45 },
    { id: uid(), date: prev(5), subCategoryId: cats[7].id, userId: u2, amount: 1800, note: "短途" },
  ];
  return {
    users: [
      { id: adminId, username: "admin", password: "admin", isAdmin: true },
      { id: u2, username: "小明", password: "123456" },
    ],
    categories: cats,
    records,
    installments: [
      { id: uid(), userId: adminId, amount: 899, start: month + "-01", end: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10), platform: "花呗" },
      { id: uid(), userId: adminId, amount: 1580, start: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 10), end: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().slice(0, 10), platform: "招行信用卡" },
      { id: uid(), userId: u2, amount: 399, start: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().slice(0, 10), end: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10), platform: "京东白条" },
      { id: uid(), userId: u2, amount: 2200, start: "2025-06-15", end: "2026-06-15", platform: "中信信用卡" },
      { id: uid(), userId: adminId, amount: 650, start: "2025-01-01", end: "2025-12-01", platform: "花呗" },
      { id: uid(), userId: u2, amount: 1200, start: "2024-10-10", end: "2025-10-10", platform: "美团月付" },
      { id: uid(), userId: adminId, amount: 480, start: "2025-03-20", end: "2026-03-20", platform: "白条" },
      { id: uid(), userId: adminId, amount: 3500, start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10), end: new Date(new Date().setMonth(new Date().getMonth() + 23)).toISOString().slice(0, 10), platform: "工行分期" },
    ],
    installmentPlatforms: [
      { id: uid(), name: "花呗" },
      { id: uid(), name: "招行信用卡" },
      { id: uid(), name: "京东白条" },
      { id: uid(), name: "中信信用卡" },
      { id: uid(), name: "美团月付" },
      { id: uid(), name: "白条" },
      { id: uid(), name: "工行分期" },
    ],
    platforms,
    repayments: [
      { id: uid(), month, userId: adminId, items: platforms.map(p => ({ platformId: p.id, amount: Math.round(Math.random() * 500 + 100) })) },
    ],
    budgets: (() => {
      const out: { month: string; total: number; ganfan: number; xiaosa: number; other: number }[] = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const base = 7500 + Math.round(Math.random() * 1500);
        out.push({ month: mm, total: base, ganfan: Math.round(base * 0.4), xiaosa: Math.round(base * 0.35), other: Math.round(base * 0.25) });
      }
      return out;
    })(),
    huis: [
      { id: uid(), name: "2026年会", start: "2026-01-01", end: "2026-12-01", principal: 1000, items: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, "0")}`, principal: 1000, interest: 20 })) },
    ],
    openRegistration: true,
    currentUserId: null,
  };
};

const KEY = "accounting-app-v4";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

const Ctx = createContext<{
  db: DB;
  setDB: (fn: (db: DB) => DB) => void;
  currentUser: User | null;
}>(null as any);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load());
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);
  const setDB = (fn: (db: DB) => DB) => setDb(prev => fn(prev));
  const currentUser = db.users.find(u => u.id === db.currentUserId) ?? null;
  return <Ctx.Provider value={{ db, setDB, currentUser }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
export const genId = uid;
export const getToday = today;
export const getMonth = todayMonth;

export function monthOf(date: string) { return date.slice(0, 7); }
export function fmtMoney(n: number) {
  return (n ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function listMonths(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
