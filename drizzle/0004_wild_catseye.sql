CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DROP INDEX "projects_active_updated_idx";--> statement-breakpoint
DROP INDEX "projects_one_system_inbox_idx";--> statement-breakpoint
DROP INDEX "tasks_project_active_idx";--> statement-breakpoint
DROP INDEX "tasks_dashboard_idx";--> statement-breakpoint
DROP INDEX "tags_scope_name_idx";--> statement-breakpoint
DROP INDEX "task_property_colors_unique_idx";--> statement-breakpoint
DROP INDEX "task_views_scope_updated_idx";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "task_property_colors" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "task_views" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_property_colors" ADD CONSTRAINT "task_property_colors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_views" ADD CONSTRAINT "task_views_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_user_active_updated_idx" ON "projects" USING btree ("user_id","archived_at","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_user_one_system_inbox_idx" ON "projects" USING btree ("user_id","is_system_inbox") WHERE "projects"."is_system_inbox" = true;--> statement-breakpoint
CREATE INDEX "tasks_user_project_active_idx" ON "tasks" USING btree ("user_id","project_id","archived_at");--> statement-breakpoint
CREATE INDEX "tasks_user_dashboard_idx" ON "tasks" USING btree ("user_id","archived_at","status","due_date");--> statement-breakpoint
CREATE INDEX "tags_scope_name_idx" ON "tags" USING btree ("user_id","project_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "task_property_colors_unique_idx" ON "task_property_colors" USING btree ("user_id","property","value");--> statement-breakpoint
CREATE INDEX "task_views_scope_updated_idx" ON "task_views" USING btree ("user_id","project_id","updated_at");