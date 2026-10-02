namespace Challenges.Dns;

public record DnsRecord(string Name, string Type, string Value, int Ttl);

public class DnsResolver
{
    public DnsResolver(Func<string, DnsRecord?> lookup, Func<long> nowSeconds)
    {
    }

    public int CacheSize => throw new NotImplementedException("Your code here");

    public string? Resolve(string name) => throw new NotImplementedException();
}
