CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE doctors (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name varchar(120) NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  specialization varchar(100) NOT NULL CHECK (length(btrim(specialization)) BETWEEN 2 AND 100),
  phone varchar(16) NOT NULL CHECK (phone ~ '^[+]?[0-9]{7,15}$'),
  email varchar(254) NOT NULL CHECK (email = lower(btrim(email)) AND length(email) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX doctors_email_unique ON doctors (lower(email));

CREATE TABLE doctor_availability (
  doctor_id integer NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  PRIMARY KEY (doctor_id, day_of_week),
  CHECK (start_time < end_time),
  CHECK (extract(epoch FROM start_time)::numeric % 900 = 0),
  CHECK (extract(epoch FROM end_time)::numeric % 900 = 0)
);

CREATE TABLE appointments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id integer NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  patient_name varchar(120) NOT NULL CHECK (length(btrim(patient_name)) BETWEEN 2 AND 120),
  patient_phone varchar(16) NOT NULL CHECK (patient_phone ~ '^[+]?[0-9]{7,15}$'),
  patient_email varchar(254),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason varchar(500) NOT NULL CHECK (length(btrim(reason)) BETWEEN 2 AND 500),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (extract(epoch FROM ends_at - starts_at) BETWEEN 900 AND 7200),
  CHECK (extract(epoch FROM ends_at - starts_at)::numeric % 900 = 0),
  CHECK (extract(epoch FROM starts_at)::numeric % 900 = 0),
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status <> 'cancelled')
);
CREATE INDEX appointments_doctor_start_idx ON appointments (doctor_id, starts_at);
CREATE INDEX appointments_status_start_idx ON appointments (status, starts_at);
