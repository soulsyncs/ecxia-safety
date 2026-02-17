-- Cronジョブが停止されたことを確認
-- このクエリの結果がゼロ行であれば成功
DO $$
DECLARE
  job_count integer;
BEGIN
  SELECT count(*) INTO job_count
  FROM cron.job
  WHERE jobname LIKE 'ecxia-%';
  
  RAISE NOTICE 'Remaining ecxia cron jobs: %', job_count;
  
  IF job_count > 0 THEN
    RAISE EXCEPTION 'Still have % ecxia cron jobs remaining', job_count;
  END IF;
END $$;
