# API rate limiter

**The ticket.** Our public API allows each client at most `N` requests in any rolling window of `W` milliseconds. Requests arrive in time order. Reject a request if it would be the (N+1)th inside the last W ms.

**Build** `RateLimiter` in `RateLimiter.cs`:

- `RateLimiter(int maxRequests, long windowMs)`.
- `bool Allow(long timestampMs)`: forget accepted requests older than `timestampMs - windowMs` (they're the OLDEST ones), then accept if fewer than N remain.
- `int InWindow`: accepted requests currently counted.

**Hint.** The oldest timestamps leave first, the newest join at the back. C# has `Queue<T>`.

**Rules.** Each Allow is O(1) amortised: don't scan or filter a list of every past request.

**Run:** `dotnet test --filter Lesson=queue`
