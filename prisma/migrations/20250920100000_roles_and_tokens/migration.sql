DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('client','artist','admin');
  END IF;
END $$;

-- Ensure the existing string values map cleanly to the Role enum
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'role') THEN
    ALTER TABLE "User"
      ALTER COLUMN "role" TYPE "Role" USING (
        CASE lower(role)
          WHEN 'admin' THEN 'admin'::"Role"
          WHEN 'artist' THEN 'artist'::"Role"
          ELSE 'client'::"Role"
        END
      );
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "activationTokenExpiresAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" TIMESTAMP;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'user'
      AND table_schema = current_schema()
      AND constraint_name = 'User_resetToken_key'
      AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_resetToken_key" UNIQUE ("resetToken");
  END IF;
END $$;
