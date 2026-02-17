-- Cronジョブの登録確認（4件あるはず）
DO $$
DECLARE
  job_count integer;
BEGIN
  SELECT count(*) INTO job_count
  FROM cron.job
  WHERE jobname LIKE 'ecxia-%';

  RAISE NOTICE 'Active ECXIA cron jobs: %', job_count;

  IF job_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 cron jobs but found %', job_count;
  END IF;
END $$;
