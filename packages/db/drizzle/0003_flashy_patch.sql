CREATE TABLE "lut_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"issued_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"issuing_authority" text NOT NULL,
	"pdf_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
