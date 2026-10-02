# Retries with backoff, and a circuit breaker

**The ticket.** Checkout calls a shipping-rates API that sometimes blips and occasionally goes down for minutes. Last outage, our instant retries hammered it so hard it couldn't come back up, and our threads piled up waiting. Build the two standard tools (the core of what Polly gives you in .NET).

A `TransientException` means "worth retrying" (a timeout, a 503). Any other exception is a real error.

**Build** `Retrier` in `Resilience.cs`:

- `Retrier(int maxAttempts, int baseDelayMs, Random rng, Action<int> sleep)`: `sleep` waits that many milliseconds (tests pass a fake that just records).
- `T Run<T>(Func<T> op)`: call `op`. If it throws `TransientException`, sleep and try again, up to `maxAttempts` calls in total, then rethrow the last exception. Any other exception is rethrown at once, without retrying.
- Delay before retry `k` (k = 1, 2, …): `base × 2^(k−1)` plus jitter, a random amount from 0 up to half of that (use `rng`). So the first wait is between `base` and `1.5 × base`.

**Build** `CircuitBreaker` in `Resilience.cs`:

- `CircuitBreaker(int failureThreshold, int openMs, Func<long> nowMs)`.
- `T Call<T>(Func<T> op)`:
  - **Closed** (normal): run `op`. Any exception counts as a failure and is rethrown; a success resets the count. `failureThreshold` failures in a row → **Open**.
  - **Open**: throw `CircuitOpenException` immediately without calling `op`, until `openMs` have passed since it opened.
  - After that it's **HalfOpen**: the next call is a trial. Success → Closed (count reset). Failure → Open again, starting a fresh `openMs`.
- `BreakerState State`.

**Hint.** The breaker needs three fields: a consecutive-failure count, whether it's open, and when it opened. `State` can be worked out from those and the clock.

**Run:** `dotnet test --filter Lesson=latency-retries`
