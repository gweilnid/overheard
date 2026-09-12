package dev.overheard.jobs;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.locks.Lock;
import java.util.logging.Logger;

@ApplicationScoped
public class Jobs {
    private static final Logger LOG = Logger.getLogger(Jobs.class.getName());
    @Inject UpdateReloadLock updateReloadLock;
    @Inject DailyReloadClaim dailyReloadClaim;
    @ConfigProperty(name = "jobs.zone") String zone;

    // No shared lock: load may run alongside update and reload.
    @Scheduled(identity = "load", cron = "${jobs.load.cron}", timeZone = "${jobs.zone}")
    void load() { runLoad(); }

    @Scheduled(identity = "update", cron = "${jobs.update.cron}", timeZone = "${jobs.zone}")
    void update() {
        Lock lock = updateReloadLock.updateLock();
        lock.lock();
        try { runUpdate(); }
        finally { lock.unlock(); }
    }

    @Scheduled(identity = "reload", cron = "${jobs.reload.cron}", timeZone = "${jobs.zone}")
    void reload() {
        LocalDate businessDate = LocalDate.now(ZoneId.of(zone));
        if (!dailyReloadClaim.claim("reload", businessDate)) {
            LOG.info(() -> "Reload already claimed for " + businessDate);
            return;
        }
        // Waits for in-flight update; the fair lock blocks newer updates next.
        Lock lock = updateReloadLock.reloadLock();
        lock.lock();
        try { runReload(); }
        finally { lock.unlock(); }
    }

    void runLoad() { LOG.info("load"); }
    void runUpdate() { LOG.info("update"); }
    void runReload() { LOG.info("reload"); }
}
