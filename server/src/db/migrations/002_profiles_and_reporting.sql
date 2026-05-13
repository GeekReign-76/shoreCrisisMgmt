-- Client profiles — extended info editable by client
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Clinical notes (owner-only)
CREATE TABLE IF NOT EXISTS clinical_profiles (
    id              SERIAL PRIMARY KEY,
    client_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    diagnosis_codes TEXT,           -- comma-separated ICD codes
    diagnosis_notes TEXT,
    treatment_goals TEXT,
    medications     TEXT,           -- JSON array or free text
    notes           TEXT,           -- general clinical notes
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Session notes — one per appointment (owner-only)
CREATE TABLE IF NOT EXISTS session_notes (
    id              SERIAL PRIMARY KEY,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    client_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments linked to a client profile
CREATE TABLE IF NOT EXISTS client_files (
    id          SERIAL PRIMARY KEY,
    client_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename    VARCHAR(255) NOT NULL,
    filepath    TEXT NOT NULL,
    file_type   VARCHAR(100),
    file_size   INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add fee/billing to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insurance_billed VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
