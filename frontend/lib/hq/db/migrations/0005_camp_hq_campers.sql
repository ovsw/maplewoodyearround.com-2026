CREATE TABLE "camper_days" (
	"camper_id" uuid NOT NULL,
	"date" date NOT NULL,
	"camp_group_id" uuid NOT NULL,
	"expected" boolean NOT NULL,
	CONSTRAINT "camper_days_camper_id_date_pk" PRIMARY KEY("camper_id","date")
);
--> statement-breakpoint
CREATE TABLE "camper_loads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"loaded_at" timestamp with time zone NOT NULL,
	"loaded_by" uuid,
	"row_count" integer NOT NULL,
	"added" integer NOT NULL,
	"changed" integer NOT NULL,
	"removed" integer NOT NULL,
	"unchanged" integer NOT NULL,
	"removals_skipped" boolean NOT NULL,
	"errors" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "campers_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
ALTER TABLE "camper_days" ADD CONSTRAINT "camper_days_camper_id_campers_id_fk" FOREIGN KEY ("camper_id") REFERENCES "public"."campers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camper_days" ADD CONSTRAINT "camper_days_camp_group_id_camp_groups_id_fk" FOREIGN KEY ("camp_group_id") REFERENCES "public"."camp_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camper_loads" ADD CONSTRAINT "camper_loads_loaded_by_staff_members_id_fk" FOREIGN KEY ("loaded_by") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "camper_days_date_group" ON "camper_days" USING btree ("date","camp_group_id");--> statement-breakpoint
CREATE INDEX "camper_days_camp_group" ON "camper_days" USING btree ("camp_group_id");--> statement-breakpoint
CREATE INDEX "camper_loads_loaded_at" ON "camper_loads" USING btree ("loaded_at");