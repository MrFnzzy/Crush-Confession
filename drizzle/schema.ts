import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const confessions = mysqlTable("confessions", {
  id: int("id").autoincrement().primaryKey(),
  fromName: varchar("fromName", { length: 100 }).notNull(),
  toName: varchar("toName", { length: 100 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  isDeleted: int("isDeleted").default(0).notNull(), // 0: active, 1: deleted
});

export const replies = mysqlTable("replies", {
  id: int("id").autoincrement().primaryKey(),
  confessionId: int("confessionId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  isDeleted: int("isDeleted").default(0).notNull(), // 0: active, 1: deleted
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Confession = typeof confessions.$inferSelect;
export type InsertConfession = typeof confessions.$inferInsert;
export type Reply = typeof replies.$inferSelect;
export type InsertReply = typeof replies.$inferInsert;