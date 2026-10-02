namespace Challenges.Dns;

public record DnsRecord(string Name, string Type, string Value, int Ttl);

public class DnsResolver
{
    private const int MaxAliases = 8;
    private readonly Func<string, DnsRecord?> _lookup;
    private readonly Func<long> _now;
    private readonly Dictionary<string, (DnsRecord Record, long ExpiresAt)> _cache = new();

    public DnsResolver(Func<string, DnsRecord?> lookup, Func<long> nowSeconds)
    {
        _lookup = lookup;
        _now = nowSeconds;
    }

    public int CacheSize
    {
        get
        {
            var now = _now();
            return _cache.Values.Count(e => now < e.ExpiresAt);
        }
    }

    private static string Normalise(string name) => name.TrimEnd('.').ToLowerInvariant();

    private DnsRecord? Get(string name)
    {
        var now = _now();
        if (_cache.TryGetValue(name, out var e) && now < e.ExpiresAt) return e.Record;
        _cache.Remove(name);
        var r = _lookup(name);
        if (r != null) _cache[name] = (r, now + r.Ttl);
        return r;
    }

    public string? Resolve(string name)
    {
        var current = Normalise(name);
        for (var aliases = 0; ; aliases++)
        {
            var r = Get(current);
            if (r == null) return null;
            if (r.Type == "A") return r.Value;
            if (aliases == MaxAliases) throw new InvalidOperationException($"Too many aliases (or a loop) resolving {name}");
            current = Normalise(r.Value);
        }
    }
}
