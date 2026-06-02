CREATE TABLE "experience_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"start_date" varchar(40) NOT NULL,
	"end_date" varchar(40) NOT NULL,
	"title" varchar(180) NOT NULL,
	"company" varchar(180) NOT NULL,
	"description" text[] DEFAULT '{}' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experience_items" ADD CONSTRAINT "experience_items_section_id_experience_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."experience_sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "experience_sections_sort_idx" ON "experience_sections" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "experience_items_section_idx" ON "experience_items" USING btree ("section_id");
--> statement-breakpoint
CREATE INDEX "experience_items_sort_idx" ON "experience_items" USING btree ("sort_order");
