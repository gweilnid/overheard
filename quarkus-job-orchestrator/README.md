# Quarkus job orchestration

| Job | Trigger | Lock | Behaviour |
| --- | --- | --- | --- |
| `load` | every hour | none | may run alongside either job |
| `update` | every 5 minutes | shared/read | cannot run during reload |
| `reload` | daily at 02:00 Europe/Istanbul | exclusive/write | waits for update, then blocks updates |

`ReentrantReadWriteLock(true)` is fair. If reload is queued while an update is
running, it gets the write lock after that update; updates arriving later wait.
Reload is not skipped merely because update is active.

## Production daily guarantee

The included `DailyReloadClaim` is deliberately in-memory and is correct only
for one process. In production, replace it with a shared database transaction:

```sql
create table job_daily_claim (
  job_name text not null,
  business_date date not null,
  claimed_at timestamptz not null default now(),
  primary key (job_name, business_date)
);
insert into job_daily_claim(job_name, business_date)
values ('reload', :businessDate) on conflict do nothing;
```

Only the instance whose insert affects one row runs reload. In a multi-replica
deployment, the update/reload lock must also be distributed (PostgreSQL advisory
lock, ShedLock, or database lease); a JVM lock coordinates only one replica.
Make reload idempotent and record `STARTED`, `SUCCEEDED`, and `FAILED` states:
one scheduled attempt per day is a different guarantee from retrying safely
after a process crash.

## Run

```powershell
mvn test
mvn quarkus:dev
```

Schedules and timezone are configurable in `src/main/resources/application.properties`.
