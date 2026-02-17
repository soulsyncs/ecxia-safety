-- 自動配信のCronジョブを全て停止
DO $$
BEGIN
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN (
    'ecxia-morning-reminder',
    'ecxia-check-pre-work',
    'ecxia-check-post-work',
    'ecxia-admin-summary'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No cron jobs found or already removed: %', SQLERRM;
END $$;
