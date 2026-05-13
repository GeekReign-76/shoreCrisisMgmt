-- Users table (both owner and clients)
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    role          VARCHAR(20) NOT NULL DEFAULT 'client',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner availability: recurring weekly slots
CREATE TABLE IF NOT EXISTS availability_slots (
    id                SERIAL PRIMARY KEY,
    owner_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week       INTEGER NOT NULL,
    start_time        TIME NOT NULL,
    end_time          TIME NOT NULL,
    slot_duration_min INTEGER DEFAULT 60,
    is_active         BOOLEAN DEFAULT TRUE,
    UNIQUE(owner_id, day_of_week, start_time)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id              SERIAL PRIMARY KEY,
    client_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    owner_id        INTEGER REFERENCES users(id),
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    booking_type    VARCHAR(20) NOT NULL DEFAULT 'slot',
    notes           TEXT,
    owner_response  TEXT,
    suggested_time  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id          SERIAL PRIMARY KEY,
    sender_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Contact/intake form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id               SERIAL PRIMARY KEY,
    full_name        VARCHAR(255) NOT NULL,
    diagnosis        TEXT,
    dob              DATE,
    insurance_provider VARCHAR(255),
    contact_method   VARCHAR(50),
    contact_value    VARCHAR(255),
    reason           TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
