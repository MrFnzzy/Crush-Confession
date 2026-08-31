-- Add the anonymous visit counter table.
CREATE TABLE IF NOT EXISTS "Visit" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);
