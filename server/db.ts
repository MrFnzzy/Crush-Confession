import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { confessions, InsertConfession, InsertReply, InsertUser, replies, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createConfession(data: InsertConfession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(confessions).values(data);
}

export async function getConfessions(includeDeleted = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const query = db.select().from(confessions);
  if (!includeDeleted) {
    query.where(eq(confessions.isDeleted, 0));
  }
  
  return await query.orderBy(desc(confessions.createdAt));
}

export async function deleteConfession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(confessions).set({ isDeleted: 1 }).where(eq(confessions.id, id));
}

export async function createReply(data: InsertReply) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(replies).values(data);
}

export async function getReplies(confessionId?: number, includeDeleted = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const query = db.select().from(replies);
  const conditions = [];
  
  if (!includeDeleted) {
    conditions.push(eq(replies.isDeleted, 0));
  }
  if (confessionId) {
    conditions.push(eq(replies.confessionId, confessionId));
  }
  
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(replies.createdAt));
}

export async function deleteReply(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(replies).set({ isDeleted: 1 }).where(eq(replies.id, id));
}
