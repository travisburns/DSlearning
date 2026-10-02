namespace Challenges.Routing;

public class RoutingTable
{
    // One table per prefix length: network address → next hop.
    private readonly Dictionary<uint, string>?[] _byLength = new Dictionary<uint, string>?[33];

    public static uint Parse(string ip)
    {
        var parts = ip.Split('.');
        if (parts.Length != 4) throw new FormatException($"Not an IPv4 address: {ip}");
        uint result = 0;
        foreach (var p in parts)
        {
            if (p.Length == 0 || p.Length > 3 || !p.All(char.IsAsciiDigit)) throw new FormatException($"Bad part '{p}' in {ip}");
            var n = int.Parse(p);
            if (n > 255) throw new FormatException($"Part {n} is over 255 in {ip}");
            result = (result << 8) | (uint)n;
        }
        return result;
    }

    public static string Format(uint ip) => $"{ip >> 24}.{(ip >> 16) & 255}.{(ip >> 8) & 255}.{ip & 255}";

    private static uint Mask(int len) => len == 0 ? 0 : uint.MaxValue << (32 - len);

    private static (uint Net, int Len) ParseCidr(string cidr)
    {
        var slash = cidr.IndexOf('/');
        if (slash < 0) throw new FormatException($"Missing /prefix in {cidr}");
        if (!int.TryParse(cidr[(slash + 1)..], out var len) || len < 0 || len > 32) throw new FormatException($"Bad prefix in {cidr}");
        return (Parse(cidr[..slash]) & Mask(len), len);
    }

    public static bool Contains(string cidr, string ip)
    {
        var (net, len) = ParseCidr(cidr);
        return (Parse(ip) & Mask(len)) == net;
    }

    public void Add(string cidr, string nextHop)
    {
        var (net, len) = ParseCidr(cidr);
        (_byLength[len] ??= new Dictionary<uint, string>())[net] = nextHop;
    }

    public string? Route(string ip)
    {
        var a = Parse(ip);
        for (var len = 32; len >= 0; len--)
        {
            var t = _byLength[len];
            if (t != null && t.TryGetValue(a & Mask(len), out var hop)) return hop;
        }
        return null;
    }
}
