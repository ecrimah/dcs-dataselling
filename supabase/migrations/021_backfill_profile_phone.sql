-- Backfill profile phone from the vendor's MoMo payout number so that existing
-- vendors (who set a MoMo number during store setup but have no profile phone)
-- have a number on file for SMS alerts. New profile-phone validation keeps it
-- populated going forward.

UPDATE public.profiles p
SET phone = btrim(v.momo_number)
FROM public.vendors v
WHERE v.user_id = p.id
  AND (p.phone IS NULL OR btrim(p.phone) = '')
  AND v.momo_number IS NOT NULL
  AND btrim(v.momo_number) <> '';
