# A caching DNS resolver

**The ticket.** Our service makes thousands of calls a second to a handful of hostnames, and every one currently does a fresh DNS lookup. Build a small caching resolver that sits in front of the real lookups and obeys TTLs, so we look things up rarely but never use an expired answer.

A `DnsRecord(string Name, string Type, string Value, int Ttl)` is either an `"A"` record (`Value` is an IP address) or a `"CNAME"` record (`Value` is another name this one is an alias for). `Ttl` is in seconds.

**Build** `DnsResolver` in `DnsResolver.cs`:

- `DnsResolver(Func<string, DnsRecord?> lookup, Func<long> nowSeconds)`: `lookup` asks the authoritative servers for one name (null if it doesn't exist); `nowSeconds` is the clock (tests use a fake one).
- `string? Resolve(string name)`: the IP address for `name`, following CNAME aliases; null if any name in the chain doesn't exist.
  - Names are case-insensitive, and a trailing dot is ignored (`Shop.Example.com.` = `shop.example.com`).
  - Each record is cached under its own name until `now >= time fetched + Ttl`; only then is `lookup` called for it again. Missing names are not cached.
  - Follow at most 8 aliases; a longer chain or a loop throws `InvalidOperationException`.
- `int CacheSize`: how many unexpired records are cached right now.

**Hint.** A `Dictionary<string, (DnsRecord Record, long ExpiresAt)>`. Resolve is a loop: normalise the name, take it from the cache or look it up, and if it's a CNAME, carry on with its target.

**Run:** `dotnet test --filter Lesson=dns`
