-- Add qual_spec column to products for quality specification persistence
ALTER TABLE products ADD COLUMN IF NOT EXISTS qual_spec JSONB;
