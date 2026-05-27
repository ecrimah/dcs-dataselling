-- Allow vendors to read their own store row regardless of approval status.
-- Without this, getCurrentVendor() returns null while status is still `pending`
-- (between RPC insert and the service-client approval update).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vendors'
      AND policyname = 'Vendors read own store'
  ) THEN
    CREATE POLICY "Vendors read own store"
      ON vendors FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;
