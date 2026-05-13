-- Rate settings for auto-calculating revenue
CREATE TABLE IF NOT EXISTS rate_settings (
    id              SERIAL PRIMARY KEY,
    owner_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    rate_per_hour   DECIMAL(10,2) NOT NULL,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add actual_duration to appointments for completed sessions
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_duration_min INTEGER;

-- Test mode flag on data
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE clinical_profiles ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
