import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = process.env.DATA_DIR || path.resolve(rootDir, "data");
const dbPath = process.env.DB_PATH || path.join(dataDir, "app.db");
const port = Number(process.env.PORT || 3133);
const host = process.env.HOST || "0.0.0.0";
const sessionCookie = "jizhang_session";
const sessionDays = 30;
const mainCategories = ["干饭钱", "潇洒钱", "其他钱"];

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function fail(status, message) {
  throw new HttpError(status, message);
}

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored || "").split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), candidate);
}

function cents(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function money(value) {
  return Number(((value || 0) / 100).toFixed(2));
}

function requiredString(value, label) {
  const str = String(value ?? "").trim();
  if (!str) fail(400, `${label}不能为空`);
  return str;
}

function optionalString(value) {
  const str = String(value ?? "").trim();
  return str || null;
}

function validDate(value, label) {
  const str = requiredString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) fail(400, `${label}格式错误`);
  return str;
}

function validMonth(value, label = "月份") {
  const str = requiredString(value, label);
  if (!/^\d{4}-\d{2}$/.test(str)) fail(400, `${label}格式错误`);
  return str;
}

function ensurePositiveAmount(value, label) {
  const amount = cents(value);
  if (amount <= 0) fail(400, `${label}必须大于0`);
  return amount;
}

function ensureNonNegativeAmount(value, label) {
  const amount = cents(value);
  if (amount < 0) fail(400, `${label}不能小于0`);
  return amount;
}

function rowUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    isAdmin: !!row.is_admin,
    isDeleted: !!row.deleted_at,
  };
}

function rowCategory(row) {
  return { id: row.id, name: row.name, main: row.main, isDeleted: !!row.deleted_at };
}

function rowPlatform(row) {
  return { id: row.id, name: row.name, isDeleted: !!row.deleted_at };
}

function rowRecord(row) {
  return {
    id: row.id,
    date: row.date,
    subCategoryId: row.category_id,
    userId: row.user_id,
    amount: money(row.amount_cents),
    note: row.note || "",
  };
}

function rowInstallment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    amount: money(row.amount_cents),
    start: row.start_date,
    end: row.end_date,
    platform: row.platform,
  };
}

function rowBudget(row) {
  return {
    month: row.month,
    total: money(row.total_cents),
    ganfan: money(row.ganfan_cents),
    xiaosa: money(row.xiaosa_cents),
    other: money(row.other_cents),
  };
}

function monthRange(start, end) {
  const startMonth = validMonth(start.slice(0, 7), "开始月份");
  const endMonth = validMonth(end.slice(0, 7), "结束月份");
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  const total = (ey - sy) * 12 + (em - sm);
  if (total < 0) fail(400, "结束日期不能早于开始日期");
  const months = [];
  for (let index = 0; index <= total; index++) {
    const date = new Date(sy, sm - 1 + index, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function setCookie(res, token) {
  res.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: sessionDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearCookie(res) {
  res.clearCookie(sessionCookie, { path: "/" });
}

function getCookie(req, name) {
  const header = req.headers.cookie || "";
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function migrate() {
  const version = db.pragma("user_version", { simple: true });
  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        main TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        amount_cents INTEGER NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS installment_platforms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        amount_cents INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        platform TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS repayment_platforms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS repayments (
        id TEXT PRIMARY KEY,
        month TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS repayment_items (
        repayment_id TEXT NOT NULL REFERENCES repayments(id) ON DELETE CASCADE,
        platform_id TEXT NOT NULL REFERENCES repayment_platforms(id),
        amount_cents INTEGER NOT NULL,
        PRIMARY KEY (repayment_id, platform_id)
      );
      CREATE TABLE IF NOT EXISTS budgets (
        month TEXT PRIMARY KEY,
        total_cents INTEGER NOT NULL,
        ganfan_cents INTEGER NOT NULL,
        xiaosa_cents INTEGER NOT NULL,
        other_cents INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS huis (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        principal_cents INTEGER NOT NULL,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS hui_items (
        hui_id TEXT NOT NULL REFERENCES huis(id) ON DELETE CASCADE,
        month TEXT NOT NULL,
        principal_cents INTEGER NOT NULL,
        interest_cents INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (hui_id, month)
      );
      CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
      CREATE INDEX IF NOT EXISTS idx_repayments_month ON repayments(month);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      PRAGMA user_version = 1;
    `);
  }
}

function seed() {
  const run = db.transaction(() => {
    const timestamp = now();
    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    if (userCount === 0) {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, is_admin, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).run(id(), "admin", hashPassword("admin"), timestamp, timestamp);
    }
    const openRegistration = db.prepare("SELECT value FROM settings WHERE key = 'openRegistration'").get();
    if (!openRegistration) {
      db.prepare("INSERT INTO settings (key, value) VALUES ('openRegistration', 'false')").run();
    }
    const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
    if (categoryCount === 0) {
      const insert = db.prepare(`
        INSERT INTO categories (id, name, main, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      [
        ["早餐", "干饭钱"],
        ["午餐", "干饭钱"],
        ["晚餐", "干饭钱"],
        ["外卖", "干饭钱"],
        ["咖啡奶茶", "潇洒钱"],
        ["购物", "潇洒钱"],
        ["娱乐", "潇洒钱"],
        ["旅游", "潇洒钱"],
        ["交通", "其他钱"],
        ["日用", "其他钱"],
        ["医疗", "其他钱"],
      ].forEach(([name, main]) => insert.run(id(), name, main, timestamp, timestamp));
    }
    const installmentPlatformCount = db.prepare("SELECT COUNT(*) AS count FROM installment_platforms").get().count;
    if (installmentPlatformCount === 0) {
      const insert = db.prepare(`
        INSERT INTO installment_platforms (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      ["花呗", "招行信用卡", "京东白条", "中信信用卡", "美团月付", "白条", "工行分期"].forEach((name) => insert.run(id(), name, timestamp, timestamp));
    }
    const repaymentPlatformCount = db.prepare("SELECT COUNT(*) AS count FROM repayment_platforms").get().count;
    if (repaymentPlatformCount === 0) {
      const insert = db.prepare(`
        INSERT INTO repayment_platforms (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      ["花呗", "信用卡", "白条"].forEach((name) => insert.run(id(), name, timestamp, timestamp));
    }
  });
  run();
}

function getSetting(key) {
  return db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value;
}

function getOpenRegistration() {
  return getSetting("openRegistration") === "true";
}

function getSessionUser(req) {
  const token = getCookie(req, sessionCookie);
  if (!token) return null;
  const session = db.prepare(`
    SELECT s.token_hash, s.expires_at, u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash(token));
  if (!session || session.deleted_at) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(session.token_hash);
    return null;
  }
  return rowUser(session);
}

function requireAuth(req, _res, next) {
  const user = getSessionUser(req);
  if (!user) return next(new HttpError(401, "请先登录"));
  req.user = user;
  next();
}

function requireAdmin(req, _res, next) {
  if (!req.user?.isAdmin) return next(new HttpError(403, "仅管理员可操作"));
  next();
}

function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(tokenHash(token), userId, expires, now());
  setCookie(res, token);
}

function getActiveUser(idValue) {
  const row = db.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").get(idValue);
  if (!row) fail(400, "用户不存在");
  return row;
}

function getActiveCategory(idValue) {
  const row = db.prepare("SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL").get(idValue);
  if (!row) fail(400, "分类不存在");
  return row;
}

function getActiveRepaymentPlatform(idValue) {
  const row = db.prepare("SELECT * FROM repayment_platforms WHERE id = ? AND deleted_at IS NULL").get(idValue);
  if (!row) fail(400, "还款平台不存在");
  return row;
}

function getRepayments() {
  const repayments = db.prepare("SELECT * FROM repayments ORDER BY month DESC, created_at DESC").all();
  const items = db.prepare("SELECT * FROM repayment_items WHERE repayment_id = ?");
  return repayments.map((row) => ({
    id: row.id,
    month: row.month,
    userId: row.user_id,
    items: items.all(row.id).map((item) => ({
      platformId: item.platform_id,
      amount: money(item.amount_cents),
    })),
  }));
}

function getHuis() {
  const huis = db.prepare("SELECT * FROM huis WHERE deleted_at IS NULL ORDER BY created_at DESC").all();
  const items = db.prepare("SELECT * FROM hui_items WHERE hui_id = ? ORDER BY month ASC");
  return huis.map((row) => ({
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    principal: money(row.principal_cents),
    items: items.all(row.id).map((item) => ({
      month: item.month,
      principal: money(item.principal_cents),
      interest: money(item.interest_cents),
    })),
  }));
}

function appData(currentUser) {
  return {
    users: db.prepare("SELECT * FROM users ORDER BY is_admin DESC, created_at ASC").all().map(rowUser),
    categories: db.prepare("SELECT * FROM categories ORDER BY created_at ASC").all().map(rowCategory),
    records: db.prepare("SELECT * FROM records ORDER BY date DESC, created_at DESC").all().map(rowRecord),
    installments: db.prepare("SELECT * FROM installments ORDER BY start_date DESC, created_at DESC").all().map(rowInstallment),
    installmentPlatforms: db.prepare("SELECT * FROM installment_platforms ORDER BY created_at ASC").all().map(rowPlatform),
    platforms: db.prepare("SELECT * FROM repayment_platforms ORDER BY created_at ASC").all().map(rowPlatform),
    repayments: getRepayments(),
    budgets: db.prepare("SELECT * FROM budgets ORDER BY month DESC").all().map(rowBudget),
    huis: getHuis(),
    openRegistration: getOpenRegistration(),
    currentUserId: currentUser?.id ?? null,
  };
}

function upsertHuiItems(huiId, start, end, principalCents) {
  const oldRows = db.prepare("SELECT month, interest_cents FROM hui_items WHERE hui_id = ?").all(huiId);
  const oldInterest = new Map(oldRows.map((row) => [row.month, row.interest_cents]));
  db.prepare("DELETE FROM hui_items WHERE hui_id = ?").run(huiId);
  const insert = db.prepare(`
    INSERT INTO hui_items (hui_id, month, principal_cents, interest_cents)
    VALUES (?, ?, ?, ?)
  `);
  monthRange(start, end).forEach((month) => insert.run(huiId, month, principalCents, oldInterest.get(month) ?? 0));
}

migrate();
seed();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/session", (req, res) => {
  const user = getSessionUser(req);
  res.json({ user, openRegistration: getOpenRegistration() });
});

app.post("/api/auth/login", (req, res) => {
  const username = requiredString(req.body.username, "用户名");
  const password = requiredString(req.body.password, "密码");
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND deleted_at IS NULL").get(username);
  if (!user || !verifyPassword(password, user.password_hash)) fail(401, "用户名或密码错误");
  createSession(user.id, res);
  res.json({ user: rowUser(user), data: appData(rowUser(user)) });
});

app.post("/api/auth/register", (req, res) => {
  if (!getOpenRegistration()) fail(403, "注册已关闭，请联系管理员");
  const username = requiredString(req.body.username, "用户名");
  const password = requiredString(req.body.password, "密码");
  const timestamp = now();
  const newUser = { id: id(), username, passwordHash: hashPassword(password) };
  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_admin, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(newUser.id, newUser.username, newUser.passwordHash, timestamp, timestamp);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) fail(409, "用户名已存在");
    throw error;
  }
  createSession(newUser.id, res);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(newUser.id);
  res.status(201).json({ user: rowUser(row), data: appData(rowUser(row)) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = getCookie(req, sessionCookie);
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  clearCookie(res);
  res.json({ ok: true });
});

app.use("/api", requireAuth);

app.get("/api/app-data", (req, res) => {
  res.json(appData(req.user));
});

app.patch("/api/settings/open-registration", requireAdmin, (req, res) => {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'openRegistration'").run(req.body.openRegistration ? "true" : "false");
  res.json(appData(req.user));
});

app.post("/api/users", requireAdmin, (req, res) => {
  const username = requiredString(req.body.username, "用户名");
  const password = requiredString(req.body.password, "密码");
  const timestamp = now();
  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_admin, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(id(), username, hashPassword(password), timestamp, timestamp);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) fail(409, "用户名已存在");
    throw error;
  }
  res.status(201).json(appData(req.user));
});

app.patch("/api/users/:id", (req, res) => {
  const target = getActiveUser(req.params.id);
  if (!req.user.isAdmin && req.user.id !== target.id) fail(403, "无权限");
  const username = requiredString(req.body.username ?? target.username, "用户名");
  const password = optionalString(req.body.password);
  const timestamp = now();
  try {
    if (password) {
      db.prepare("UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?").run(username, hashPassword(password), timestamp, target.id);
    } else {
      db.prepare("UPDATE users SET username = ?, updated_at = ? WHERE id = ?").run(username, timestamp, target.id);
    }
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) fail(409, "用户名已存在");
    throw error;
  }
  res.json(appData(rowUser(db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id))));
});

app.delete("/api/users/:id", requireAdmin, (req, res) => {
  const target = getActiveUser(req.params.id);
  if (target.is_admin) fail(400, "管理员不可删除");
  const timestamp = now();
  db.prepare("UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, target.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(target.id);
  res.json(appData(req.user));
});

app.post("/api/records", (req, res) => {
  const date = validDate(req.body.date, "日期");
  const categoryId = requiredString(req.body.subCategoryId, "分类");
  const userId = requiredString(req.body.userId, "付款人");
  getActiveCategory(categoryId);
  getActiveUser(userId);
  const amount = ensurePositiveAmount(req.body.amount, "金额");
  const timestamp = now();
  db.prepare(`
    INSERT INTO records (id, date, category_id, user_id, amount_cents, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id(), date, categoryId, userId, amount, optionalString(req.body.note), timestamp, timestamp);
  res.status(201).json(appData(req.user));
});

app.patch("/api/records/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM records WHERE id = ?").get(req.params.id);
  if (!existing) fail(404, "记录不存在");
  const date = validDate(req.body.date, "日期");
  const categoryId = requiredString(req.body.subCategoryId, "分类");
  const userId = requiredString(req.body.userId, "付款人");
  getActiveCategory(categoryId);
  getActiveUser(userId);
  const amount = ensurePositiveAmount(req.body.amount, "金额");
  db.prepare(`
    UPDATE records SET date = ?, category_id = ?, user_id = ?, amount_cents = ?, note = ?, updated_at = ?
    WHERE id = ?
  `).run(date, categoryId, userId, amount, optionalString(req.body.note), now(), existing.id);
  res.json(appData(req.user));
});

app.delete("/api/records/:id", (req, res) => {
  db.prepare("DELETE FROM records WHERE id = ?").run(req.params.id);
  res.json(appData(req.user));
});

app.post("/api/categories", (req, res) => {
  const name = requiredString(req.body.name, "子类名称");
  const main = requiredString(req.body.main, "所属大类");
  if (!mainCategories.includes(main)) fail(400, "所属大类错误");
  const timestamp = now();
  db.prepare(`
    INSERT INTO categories (id, name, main, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id(), name, main, timestamp, timestamp);
  res.status(201).json(appData(req.user));
});

app.patch("/api/categories/:id", (req, res) => {
  getActiveCategory(req.params.id);
  const name = requiredString(req.body.name, "子类名称");
  const main = requiredString(req.body.main, "所属大类");
  if (!mainCategories.includes(main)) fail(400, "所属大类错误");
  db.prepare("UPDATE categories SET name = ?, main = ?, updated_at = ? WHERE id = ?").run(name, main, now(), req.params.id);
  res.json(appData(req.user));
});

app.delete("/api/categories/:id", (req, res) => {
  getActiveCategory(req.params.id);
  db.prepare("UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ?").run(now(), now(), req.params.id);
  res.json(appData(req.user));
});

app.put("/api/budgets/:month", (req, res) => {
  const month = validMonth(req.params.month);
  const total = ensurePositiveAmount(req.body.total, "总预算");
  const ganfan = ensureNonNegativeAmount(req.body.ganfan, "干饭钱预算");
  const xiaosa = ensureNonNegativeAmount(req.body.xiaosa, "潇洒钱预算");
  const other = ensureNonNegativeAmount(req.body.other, "其他钱预算");
  if (ganfan + xiaosa + other !== total) fail(400, "三个大类预算之和必须等于总预算");
  const timestamp = now();
  db.prepare(`
    INSERT INTO budgets (month, total_cents, ganfan_cents, xiaosa_cents, other_cents, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(month) DO UPDATE SET
      total_cents = excluded.total_cents,
      ganfan_cents = excluded.ganfan_cents,
      xiaosa_cents = excluded.xiaosa_cents,
      other_cents = excluded.other_cents,
      updated_at = excluded.updated_at
  `).run(month, total, ganfan, xiaosa, other, timestamp, timestamp);
  res.json(appData(req.user));
});

function platformRoutes(route, table) {
  app.post(route, (req, res) => {
    const name = requiredString(req.body.name, "平台名称");
    const timestamp = now();
    db.prepare(`INSERT INTO ${table} (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(id(), name, timestamp, timestamp);
    res.status(201).json(appData(req.user));
  });
  app.patch(`${route}/:id`, (req, res) => {
    const name = requiredString(req.body.name, "平台名称");
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`).get(req.params.id);
    if (!row) fail(404, "平台不存在");
    db.prepare(`UPDATE ${table} SET name = ?, updated_at = ? WHERE id = ?`).run(name, now(), req.params.id);
    res.json(appData(req.user));
  });
  app.delete(`${route}/:id`, (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`).get(req.params.id);
    if (!row) fail(404, "平台不存在");
    db.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(now(), now(), req.params.id);
    res.json(appData(req.user));
  });
}

platformRoutes("/api/installment-platforms", "installment_platforms");
platformRoutes("/api/repayment-platforms", "repayment_platforms");

app.post("/api/installments", (req, res) => {
  const userId = requiredString(req.body.userId, "分期用户");
  getActiveUser(userId);
  const amount = ensurePositiveAmount(req.body.amount, "分期费用");
  const start = validDate(req.body.start, "开始时间");
  const end = validDate(req.body.end, "结束时间");
  if (end < start) fail(400, "结束时间不能早于开始时间");
  const platform = requiredString(req.body.platform, "分期平台");
  const timestamp = now();
  db.prepare(`
    INSERT INTO installments (id, user_id, amount_cents, start_date, end_date, platform, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id(), userId, amount, start, end, platform, timestamp, timestamp);
  res.status(201).json(appData(req.user));
});

app.patch("/api/installments/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM installments WHERE id = ?").get(req.params.id);
  if (!existing) fail(404, "分期不存在");
  const userId = requiredString(req.body.userId, "分期用户");
  getActiveUser(userId);
  const amount = ensurePositiveAmount(req.body.amount, "分期费用");
  const start = validDate(req.body.start, "开始时间");
  const end = validDate(req.body.end, "结束时间");
  if (end < start) fail(400, "结束时间不能早于开始时间");
  const platform = requiredString(req.body.platform, "分期平台");
  db.prepare(`
    UPDATE installments SET user_id = ?, amount_cents = ?, start_date = ?, end_date = ?, platform = ?, updated_at = ?
    WHERE id = ?
  `).run(userId, amount, start, end, platform, now(), existing.id);
  res.json(appData(req.user));
});

app.delete("/api/installments/:id", (req, res) => {
  db.prepare("DELETE FROM installments WHERE id = ?").run(req.params.id);
  res.json(appData(req.user));
});

function saveRepayment(existingId, body) {
  const month = validMonth(body.month);
  const userId = requiredString(body.userId, "还款人");
  getActiveUser(userId);
  const items = Array.isArray(body.items) ? body.items : [];
  const normalized = items
    .map((item) => ({
      platformId: requiredString(item.platformId, "还款平台"),
      amount: ensureNonNegativeAmount(item.amount, "还款金额"),
    }))
    .filter((item) => item.amount > 0);
  normalized.forEach((item) => getActiveRepaymentPlatform(item.platformId));
  const repaymentId = existingId || id();
  const timestamp = now();
  const run = db.transaction(() => {
    if (existingId) {
      const existing = db.prepare("SELECT * FROM repayments WHERE id = ?").get(existingId);
      if (!existing) fail(404, "还款记录不存在");
      db.prepare("UPDATE repayments SET month = ?, user_id = ?, updated_at = ? WHERE id = ?").run(month, userId, timestamp, existingId);
      db.prepare("DELETE FROM repayment_items WHERE repayment_id = ?").run(existingId);
    } else {
      db.prepare("INSERT INTO repayments (id, month, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(repaymentId, month, userId, timestamp, timestamp);
    }
    const insertItem = db.prepare("INSERT INTO repayment_items (repayment_id, platform_id, amount_cents) VALUES (?, ?, ?)");
    normalized.forEach((item) => insertItem.run(repaymentId, item.platformId, item.amount));
  });
  run();
}

app.post("/api/repayments", (req, res) => {
  saveRepayment(null, req.body);
  res.status(201).json(appData(req.user));
});

app.patch("/api/repayments/:id", (req, res) => {
  saveRepayment(req.params.id, req.body);
  res.json(appData(req.user));
});

app.delete("/api/repayments/:id", (req, res) => {
  db.prepare("DELETE FROM repayments WHERE id = ?").run(req.params.id);
  res.json(appData(req.user));
});

app.post("/api/huis", (req, res) => {
  const name = requiredString(req.body.name, "会钱名称");
  const start = validDate(req.body.start, "开始日期");
  const end = validDate(req.body.end, "结束日期");
  if (end < start) fail(400, "结束日期不能早于开始日期");
  const principal = ensurePositiveAmount(req.body.principal, "本金");
  const huiId = id();
  const timestamp = now();
  const run = db.transaction(() => {
    db.prepare(`
      INSERT INTO huis (id, name, start_date, end_date, principal_cents, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(huiId, name, start, end, principal, timestamp, timestamp);
    upsertHuiItems(huiId, start, end, principal);
  });
  run();
  res.status(201).json(appData(req.user));
});

app.patch("/api/huis/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM huis WHERE id = ? AND deleted_at IS NULL").get(req.params.id);
  if (!existing) fail(404, "会钱不存在");
  const name = requiredString(req.body.name, "会钱名称");
  const start = validDate(req.body.start, "开始日期");
  const end = validDate(req.body.end, "结束日期");
  if (end < start) fail(400, "结束日期不能早于开始日期");
  const principal = ensurePositiveAmount(req.body.principal, "本金");
  const run = db.transaction(() => {
    db.prepare(`
      UPDATE huis SET name = ?, start_date = ?, end_date = ?, principal_cents = ?, updated_at = ?
      WHERE id = ?
    `).run(name, start, end, principal, now(), existing.id);
    upsertHuiItems(existing.id, start, end, principal);
  });
  run();
  res.json(appData(req.user));
});

app.delete("/api/huis/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM huis WHERE id = ? AND deleted_at IS NULL").get(req.params.id);
  if (!existing) fail(404, "会钱不存在");
  db.prepare("UPDATE huis SET deleted_at = ?, updated_at = ? WHERE id = ?").run(now(), now(), existing.id);
  res.json(appData(req.user));
});

app.patch("/api/huis/:id/items/:month", (req, res) => {
  const month = validMonth(req.params.month);
  const interest = ensureNonNegativeAmount(req.body.interest, "利息");
  const info = db.prepare("UPDATE hui_items SET interest_cents = ? WHERE hui_id = ? AND month = ?").run(interest, req.params.id, month);
  if (info.changes === 0) fail(404, "会钱明细不存在");
  res.json(appData(req.user));
});

app.get("/api/admin/backup", requireAdmin, (_req, res) => {
  db.pragma("wal_checkpoint(TRUNCATE)");
  res.download(dbPath, `jizhang-backup-${new Date().toISOString().slice(0, 10)}.db`);
});

const distDir = path.resolve(rootDir, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.sendFile(path.join(distDir, "index.html"));
      return;
    }
    next();
  });
}

app.use((error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: error.message || "服务器错误" });
});

app.listen(port, host, () => {
  console.log(`Jizhang server listening on http://${host}:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});
