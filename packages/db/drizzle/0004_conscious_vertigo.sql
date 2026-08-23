CREATE TABLE "fircs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firc_number" text NOT NULL,
	"issuing_bank" text NOT NULL,
	"date_of_issuance" date NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"exchange_rate" numeric,
	"amount_inr" numeric,
	"purpose_code" text,
	"pdf_path" text,
	"unmapped_amount_inr" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
