package dev.overheard.jobs;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import java.time.LocalDate;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Development-only; use a shared database implementation in production. */
@Alternative
@Priority(1)
@ApplicationScoped
public class InMemoryDailyReloadClaim implements DailyReloadClaim {
    private final Set<String> claims = ConcurrentHashMap.newKeySet();
    @Override public boolean claim(String jobName, LocalDate businessDate) {
        return claims.add(jobName + ':' + businessDate);
    }
}
