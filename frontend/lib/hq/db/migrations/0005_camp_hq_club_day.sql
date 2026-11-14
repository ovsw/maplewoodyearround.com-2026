CREATE TABLE "club_day_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team" smallint NOT NULL,
	"weekday" smallint NOT NULL,
	"activity_id" uuid NOT NULL,
	"max_per_period" smallint NOT NULL,
	"max_per_group" smallint,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "club_day_options_team_range" CHECK ("club_day_options"."team" between 1 and 4),
	CONSTRAINT "club_day_options_weekday_range" CHECK ("club_day_options"."weekday" between 1 and 5),
	CONSTRAINT "club_day_options_max_per_period" CHECK ("club_day_options"."max_per_period" > 0),
	CONSTRAINT "club_day_options_max_per_group" CHECK ("club_day_options"."max_per_group" is null or ("club_day_options"."max_per_group" > 0 and "club_day_options"."max_per_group" <= "club_day_options"."max_per_period"))
);
--> statement-breakpoint
CREATE TABLE "club_day_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"signup_open_minute" smallint NOT NULL,
	"signup_lock_minute" smallint NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "club_day_settings_one_row" CHECK ("club_day_settings"."id" = 1),
	CONSTRAINT "club_day_settings_window" CHECK ("club_day_settings"."signup_open_minute" >= 0 and "club_day_settings"."signup_lock_minute" <= 1440 and "club_day_settings"."signup_open_minute" < "club_day_settings"."signup_lock_minute")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "club_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "club_day_options" ADD CONSTRAINT "club_day_options_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_day_options_unique" ON "club_day_options" USING btree ("team","weekday","activity_id");--> statement-breakpoint
CREATE INDEX "club_day_options_activity" ON "club_day_options" USING btree ("activity_id");