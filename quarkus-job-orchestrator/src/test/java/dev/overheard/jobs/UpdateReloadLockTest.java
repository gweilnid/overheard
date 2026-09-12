package dev.overheard.jobs;

import org.junit.jupiter.api.Test;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;

class UpdateReloadLockTest {
    @Test
    void reload_waits_for_update_then_excludes_a_new_update() throws Exception {
        var locks = new UpdateReloadLock();
        var updateStarted = new CountDownLatch(1);
        var releaseUpdate = new CountDownLatch(1);
        var reloadStarted = new CountDownLatch(1);
        var secondUpdateEntered = new AtomicBoolean(false);
        Thread firstUpdate = new Thread(() -> {
            locks.updateLock().lock();
            try { updateStarted.countDown(); releaseUpdate.await(); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            finally { locks.updateLock().unlock(); }
        });
        Thread reload = new Thread(() -> {
            locks.reloadLock().lock();
            try { reloadStarted.countDown(); Thread.sleep(100); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            finally { locks.reloadLock().unlock(); }
        });
        Thread secondUpdate = new Thread(() -> {
            locks.updateLock().lock();
            try { secondUpdateEntered.set(true); }
            finally { locks.updateLock().unlock(); }
        });
        firstUpdate.start(); assertTrue(updateStarted.await(1, TimeUnit.SECONDS));
        reload.start(); Thread.sleep(30); secondUpdate.start(); Thread.sleep(30);
        assertFalse(secondUpdateEntered.get());
        releaseUpdate.countDown();
        assertTrue(reloadStarted.await(1, TimeUnit.SECONDS));
        reload.join(); secondUpdate.join();
        assertTrue(secondUpdateEntered.get());
    }
}
