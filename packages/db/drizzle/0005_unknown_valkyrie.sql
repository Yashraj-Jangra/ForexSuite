CREATE TABLE "rbi_purpose_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "rbi_purpose_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "remittances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remitter_name" text NOT NULL,
	"remitter_pan" text NOT NULL,
	"remitter_aadhaar" text,
	"remitter_account" text,
	"beneficiary_name" text NOT NULL,
	"beneficiary_bank_details" text,
	"beneficiary_country" text NOT NULL,
	"purpose_code" text NOT NULL,
	"purpose_description" text,
	"amount_foreign" numeric NOT NULL,
	"currency" text NOT NULL,
	"exchange_rate" numeric,
	"amount_inr" numeric,
	"tcs_percentage" numeric,
	"tcs_amount" numeric,
	"pan_financial_year_remitted_total" numeric,
	"form_a2_pdf_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
