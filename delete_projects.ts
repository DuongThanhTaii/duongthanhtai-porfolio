import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects } from "./src/db/schema";
import { not, ilike } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log("Fetching existing projects...");
  const allProjects = await db.select({ id: projects.id, title: projects.title }).from(projects);
  console.log("Found projects:", allProjects);
  
  console.log("Deleting projects except 'Thanh Tai Portfolio'...");
  const result = await db.delete(projects)
    .where(not(ilike(projects.title, "%Thanh Tai Portfolio%")))
    .returning({ id: projects.id, title: projects.title });
    
  console.log("Deleted projects:", result);
  
  const remainingProjects = await db.select({ id: projects.id, title: projects.title }).from(projects);
  console.log("Remaining projects:", remainingProjects);
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Error deleting projects:", err);
  process.exit(1);
});
