CREATE TYPE "public"."activity_kind" AS ENUM('exclusive', 'shared');--> statement-breakpoint
CREATE TYPE "public"."grade" AS ENUM('preschool', 'kindergarten', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'grade_7', 'grade_8', 'grade_9');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"grades" "grade"[] NOT NULL,
	"kind" "activity_kind" DEFAULT 'exclusive' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camp_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"grades" "grade"[] NOT NULL,
	"team" smallint NOT NULL,
	"team_is_sample" boolean DEFAULT false NOT NULL,
	"change_location" text DEFAULT '' NOT NULL,
	"free_swim_location" text DEFAULT '' NOT NULL,
	"lunch_location" text DEFAULT '' NOT NULL,
	"swim_lessons_location" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "camp_groups_team_range" CHECK ("camp_groups"."team" between 1 and 4)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "activities_name_unique" ON "activities" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "camp_groups_name_unique" ON "camp_groups" USING btree (lower("name"));