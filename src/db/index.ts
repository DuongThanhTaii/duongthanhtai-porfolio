import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  const client =
    globalForDb.client ??
    postgres(connectionString, {
      prepare: false,
      max: 5,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  const database = drizzle(client, { schema, casing: "snake_case" });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = database;
  }
  return database;
}

export { schema };
