package dev.overheard.jobs;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/** update is a reader; reload is the exclusive writer. Fairness prevents starvation. */
@ApplicationScoped
public class UpdateReloadLock {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock(true);
    public Lock updateLock() { return lock.readLock(); }
    public Lock reloadLock() { return lock.writeLock(); }
}
