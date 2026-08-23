CREATE TABLE "forex_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date NOT NULL,
	"currency" text NOT NULL,
	"transaction_type" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric NOT NULL,
	"conversion_rate" numeric,
	"customer_name" text,
	"customer_passport_kyc" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
