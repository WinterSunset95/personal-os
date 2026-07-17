CREATE TABLE "task_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"pathname" text NOT NULL,
	"blob_url" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_system_inbox" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_attachments_task_idx" ON "task_attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_attachments_created_idx" ON "task_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "task_attachments_blob_url_idx" ON "task_attachments" USING btree ("blob_url");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_one_system_inbox_idx" ON "projects" USING btree ("is_system_inbox") WHERE "projects"."is_system_inbox" = true;