import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type MainCategory = "干饭钱" | "潇洒钱" | "其他钱";
export const MAIN_CATEGORIES: MainCategory[] = ["干饭钱", "潇洒钱", "其他钱"];

export type SubCategory = { id: string; name: string; main: MainCategory; isDeleted?: boolean };
export type User = { id: string; username: string; isAdmin?: boolean; isDeleted?: boolean };
export type Record = {
  id: string; date: string; subCategoryId: string; userId: string;
  amount: number; note?: string;
};
export type Installment = {
  id: string; userId: string; content: string; amount: number; start: string; end: string; platform: string;
};
export type Platform = { id: string; name: string; isDeleted?: boolean };
export type Repayment = {
  id: string; month: string; userId: string; items: { platformId: string; amount: number }[];
};
export type Budget = { month: string; total: number; ganfan: number; xiaosa: number; other: number };
export type HuiItem = { month: string; principal: number; interest: number };
export type Hui = { id: string; name: string; start: string; end: string; principal: number; items: HuiItem[] };

export type DB = {
  users: User[];
  categories: SubCategory[];
  records: Record[];
  installments: Installment[];
  installmentPlatforms: Platform[];
  platforms: Platform[];
  repayments: Repayment[];
  budgets: Budget[];
  huis: Hui[];
  openRegistration: boolean;
  currentUserId: string | null;
};

type SaveUserPayload = { id?: string; username: string; password?: string; passwordConfirm?: string };
type SaveRecordPayload = Omit<Record, "id"> & { id?: string };
type SaveCategoryPayload = Omit<SubCategory, "id" | "isDeleted"> & { id?: string };
type SavePlatformPayload = { id?: string; name: string };
type SaveInstallmentPayload = Omit<Installment, "id"> & { id?: string };
type SaveRepaymentPayload = Omit<Repayment, "id"> & { id?: string };
type SaveHuiPayload = Omit<Hui, "id" | "items"> & { id?: string };

type Actions = {
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, passwordConfirm?: string) => Promise<void>;
  logout: () => Promise<void>;
  setOpenRegistration: (value: boolean) => Promise<void>;
  saveUser: (payload: SaveUserPayload) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  saveRecord: (payload: SaveRecordPayload) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  saveCategory: (payload: SaveCategoryPayload) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveBudget: (payload: Budget) => Promise<void>;
  saveInstallment: (payload: SaveInstallmentPayload) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  saveInstallmentPlatform: (payload: SavePlatformPayload) => Promise<void>;
  deleteInstallmentPlatform: (id: string) => Promise<void>;
  saveRepayment: (payload: SaveRepaymentPayload) => Promise<void>;
  deleteRepayment: (id: string) => Promise<void>;
  saveRepaymentPlatform: (payload: SavePlatformPayload) => Promise<void>;
  deleteRepaymentPlatform: (id: string) => Promise<void>;
  saveHui: (payload: SaveHuiPayload) => Promise<void>;
  deleteHui: (id: string) => Promise<void>;
  updateHuiInterest: (id: string, month: string, interest: number) => Promise<void>;
};

const emptyDB: DB = {
  users: [],
  categories: [],
  records: [],
  installments: [],
  installmentPlatforms: [],
  platforms: [],
  repayments: [],
  budgets: [],
  huis: [],
  openRegistration: false,
  currentUserId: null,
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json", ...(init.headers || {}) } : init?.headers,
    ...init,
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(body?.error || "请求失败");
  }
  return body as T;
}

const Ctx = createContext<{
  db: DB;
  currentUser: User | null;
  loading: boolean;
  actions: Actions;
}>(null as any);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDB);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyData = useCallback((data: DB) => {
    setDb(data);
    setCurrentUser(data.users.find((user) => user.id === data.currentUserId) ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const session = await request<{ user: User | null; openRegistration: boolean }>("/api/session");
    setCurrentUser(session.user);
    if (!session.user) {
      setDb({ ...emptyDB, openRegistration: session.openRegistration });
      return;
    }
    const data = await request<DB>("/api/app-data");
    applyData(data);
  }, [applyData]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const mutate = useCallback(async (url: string, init?: RequestInit) => {
    const data = await request<DB>(url, init);
    applyData(data);
  }, [applyData]);

  const actions = useMemo<Actions>(() => ({
    refresh,
    login: async (username, password) => {
      const response = await request<{ user: User; data: DB }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      applyData(response.data);
    },
    register: async (username, password, passwordConfirm) => {
      const response = await request<{ user: User; data: DB }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, passwordConfirm }),
      });
      applyData(response.data);
    },
    logout: async () => {
      await request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
      const session = await request<{ user: User | null; openRegistration: boolean }>("/api/session");
      setCurrentUser(null);
      setDb({ ...emptyDB, openRegistration: session.openRegistration });
    },
    setOpenRegistration: (value) => mutate("/api/settings/open-registration", {
      method: "PATCH",
      body: JSON.stringify({ openRegistration: value }),
    }),
    saveUser: (payload) => mutate(payload.id ? `/api/users/${payload.id}` : "/api/users", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteUser: (id) => mutate(`/api/users/${id}`, { method: "DELETE" }),
    saveRecord: (payload) => mutate(payload.id ? `/api/records/${payload.id}` : "/api/records", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteRecord: (id) => mutate(`/api/records/${id}`, { method: "DELETE" }),
    saveCategory: (payload) => mutate(payload.id ? `/api/categories/${payload.id}` : "/api/categories", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteCategory: (id) => mutate(`/api/categories/${id}`, { method: "DELETE" }),
    saveBudget: (payload) => mutate(`/api/budgets/${payload.month}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
    saveInstallment: (payload) => mutate(payload.id ? `/api/installments/${payload.id}` : "/api/installments", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteInstallment: (id) => mutate(`/api/installments/${id}`, { method: "DELETE" }),
    saveInstallmentPlatform: (payload) => mutate(payload.id ? `/api/installment-platforms/${payload.id}` : "/api/installment-platforms", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteInstallmentPlatform: (id) => mutate(`/api/installment-platforms/${id}`, { method: "DELETE" }),
    saveRepayment: (payload) => mutate(payload.id ? `/api/repayments/${payload.id}` : "/api/repayments", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteRepayment: (id) => mutate(`/api/repayments/${id}`, { method: "DELETE" }),
    saveRepaymentPlatform: (payload) => mutate(payload.id ? `/api/repayment-platforms/${payload.id}` : "/api/repayment-platforms", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteRepaymentPlatform: (id) => mutate(`/api/repayment-platforms/${id}`, { method: "DELETE" }),
    saveHui: (payload) => mutate(payload.id ? `/api/huis/${payload.id}` : "/api/huis", {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    }),
    deleteHui: (id) => mutate(`/api/huis/${id}`, { method: "DELETE" }),
    updateHuiInterest: (id, month, interest) => mutate(`/api/huis/${id}/items/${month}`, {
      method: "PATCH",
      body: JSON.stringify({ interest }),
    }),
  }), [applyData, mutate, refresh]);

  return <Ctx.Provider value={{ db, currentUser, loading, actions }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
export const getToday = () => new Date().toISOString().slice(0, 10);
export const getMonth = () => new Date().toISOString().slice(0, 7);

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
