ALTER TABLE "customers" DROP CONSTRAINT "customers_street_id_streets_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_group_id_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_personality_id_personality_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "formatted_address" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "center_latitude" double precision;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "center_longitude" double precision;--> statement-breakpoint
ALTER TABLE "streets" ADD COLUMN "center_latitude" double precision;--> statement-breakpoint
ALTER TABLE "streets" ADD COLUMN "center_longitude" double precision;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_street_id_streets_id_fk" FOREIGN KEY ("street_id") REFERENCES "public"."streets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_personality_id_personality_tags_id_fk" FOREIGN KEY ("personality_id") REFERENCES "public"."personality_tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personality_tags" ADD CONSTRAINT "personality_tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streets" ADD CONSTRAINT "streets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_user_street_name_unique" UNIQUE("user_id","street_id","name");--> statement-breakpoint
ALTER TABLE "personality_tags" ADD CONSTRAINT "personality_tags_user_label_unique" UNIQUE("user_id","label");--> statement-breakpoint
ALTER TABLE "streets" ADD CONSTRAINT "streets_user_name_unique" UNIQUE("user_id","name");