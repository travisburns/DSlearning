# API rate limiters

**The ticket.** One customer's buggy script took the public API down last week. We need two limiters: a token bucket for the overall API (allows short bursts) and an exact sliding-window limit per API key ("100 requests in any 60 seconds"). Thousands of keys, millions of requests: each check must be cheap.

**Build** in `RateLimiters.cs`:

`TokenBucket(int capacity, double refillPerSecond, Func<long> nowMs)`:
- Starts full. Tokens refill continuously at `refillPerSecond` (half a second at 2/s = 1 token), never above `capacity`.
- `bool TryTake(int tokens = 1)`: if at least `tokens` are available, take them and return true; otherwise take nothing and return false.
- `double Available`.

`SlidingWindowLimiter(int limit, int windowMs, Func<long> nowMs)`:
- `bool Allow(string client)`: true if that client has had fewer than `limit` **allowed** requests in the last `windowMs` (a request at time `t` still counts while `now - t < windowMs`); the allowed request is then recorded. Rejected requests aren't recorded. Clients are independent.

**Hint.** The bucket only needs two fields: the token count and when it was last topped up; work out the refill lazily on each call. The sliding window needs a `Queue<long>` of timestamps per client (`Dictionary<string, Queue<long>>`): drop old ones from the front, count what's left.

**Run:** `dotnet test --filter Lesson=rate-limiting`
