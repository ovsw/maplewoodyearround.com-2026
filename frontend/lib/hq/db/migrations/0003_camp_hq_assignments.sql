CREATE TABLE "activity_specialists" (
	"activity_id" uuid PRIMARY KEY NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_leaders" (
	"camp_group_id" uuid PRIMARY KEY NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "group_leaders_staff_member_id_unique" UNIQUE("staff_member_id")
);
--> statement-breakpoint
CREATE TABLE "junior_placements" (
	"staff_member_id" uuid PRIMARY KEY NOT NULL,
	"camp_group_id" uuid NOT NULL,
	"club_day_activity_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_specialists" ADD CONSTRAINT "activity_specialists_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_specialists" ADD CONSTRAINT "activity_specialists_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_leaders" ADD CONSTRAINT "group_leaders_camp_group_id_camp_groups_id_fk" FOREIGN KEY ("camp_group_id") REFERENCES "public"."camp_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_leaders" ADD CONSTRAINT "group_leaders_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junior_placements" ADD CONSTRAINT "junior_placements_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junior_placements" ADD CONSTRAINT "junior_placements_camp_group_id_camp_groups_id_fk" FOREIGN KEY ("camp_group_id") REFERENCES "public"."camp_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junior_placements" ADD CONSTRAINT "junior_placements_club_day_activity_id_activities_id_fk" FOREIGN KEY ("club_day_activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_specialists_staff_member" ON "activity_specialists" USING btree ("staff_member_id");--> statement-breakpoint
CREATE INDEX "junior_placements_camp_group" ON "junior_placements" USING btree ("camp_group_id");--> statement-breakpoint
CREATE INDEX "junior_placements_club_day_activity" ON "junior_placements" USING btree ("club_day_activity_id");