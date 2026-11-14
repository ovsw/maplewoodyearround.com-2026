CREATE TABLE "schedule_days" (
	"camp_group_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "schedule_days_camp_group_id_weekday_pk" PRIMARY KEY("camp_group_id","weekday"),
	CONSTRAINT "schedule_days_weekday_range" CHECK ("schedule_days"."weekday" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"camp_group_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" smallint NOT NULL,
	"end_minute" smallint NOT NULL,
	"activity_id" uuid,
	"is_club_day" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "schedule_slots_times" CHECK ("schedule_slots"."start_minute" >= 0 and "schedule_slots"."end_minute" <= 1440 and "schedule_slots"."start_minute" < "schedule_slots"."end_minute"),
	CONSTRAINT "schedule_slots_one_use" CHECK (not ("schedule_slots"."is_club_day" and "schedule_slots"."activity_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "schedule_days" ADD CONSTRAINT "schedule_days_camp_group_id_camp_groups_id_fk" FOREIGN KEY ("camp_group_id") REFERENCES "public"."camp_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_day_fk" FOREIGN KEY ("camp_group_id","weekday") REFERENCES "public"."schedule_days"("camp_group_id","weekday") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_slots_day_index" ON "schedule_slots" USING btree ("camp_group_id","weekday");--> statement-breakpoint
CREATE INDEX "schedule_slots_activity_index" ON "schedule_slots" USING btree ("activity_id","weekday");