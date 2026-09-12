package dev.overheard.jobs;

import java.time.LocalDate;

/** Production implementation must atomically persist UNIQUE(job_name, business_date). */
public interface DailyReloadClaim {
    boolean claim(String jobName, LocalDate businessDate);
}
