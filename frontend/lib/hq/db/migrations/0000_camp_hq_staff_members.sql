CREATE TYPE "public"."account_role" AS ENUM('admin', 'senior_staff');--> statement-breakpoint
CREATE TYPE "public"."staff_kind" AS ENUM('senior', 'junior');--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "staff_kind" NOT NULL,
	"clerk_user_id" text,
	"role" "account_role",
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "staff_members_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "staff_members_role_needs_account" CHECK (("staff_members"."clerk_user_id" is null) = ("staff_members"."role" is null))
);
