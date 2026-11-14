CREATE TABLE "club_day_picks" (
	"camper_id" uuid NOT NULL,
	"date" date NOT NULL,
	"period" smallint NOT NULL,
	"option_id" uuid NOT NULL,
	"entered_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "club_day_picks_camper_id_date_period_pk" PRIMARY KEY("camper_id","date","period"),
	CONSTRAINT "club_day_picks_period" CHECK ("club_day_picks"."period" >= 1)
);
--> statement-breakpoint
ALTER TABLE "club_day_picks" ADD CONSTRAINT "club_day_picks_camper_id_campers_id_fk" FOREIGN KEY ("camper_id") REFERENCES "public"."campers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_day_picks" ADD CONSTRAINT "club_day_picks_option_id_club_day_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."club_day_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_day_picks" ADD CONSTRAINT "club_day_picks_entered_by_staff_members_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_day_picks_option_date" ON "club_day_picks" USING btree ("option_id","date","period");--> statement-breakpoint
CREATE INDEX "club_day_picks_date" ON "club_day_picks" USING btree ("date");