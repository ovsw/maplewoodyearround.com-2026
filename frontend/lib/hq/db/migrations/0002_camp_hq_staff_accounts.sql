ALTER TABLE "staff_members" ADD COLUMN "account_email" text;--> statement-breakpoint
ALTER TABLE "staff_members" ADD COLUMN "account_switched_off" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_account_email_unique" UNIQUE("account_email");--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_switched_off_needs_account" CHECK (not "staff_members"."account_switched_off" or "staff_members"."clerk_user_id" is not null);