namespace Challenges.Bloom;

public class BloomFilter
{
    private readonly ulong[] _bits;
    private readonly int _m, _k;

    public BloomFilter(int expectedItems, double falsePositiveRate)
    {
        _m = (int)Math.Ceiling(-expectedItems * Math.Log(falsePositiveRate) / (Math.Log(2) * Math.Log(2)));
        _k = Math.Max(1, (int)Math.Round((double)_m / expectedItems * Math.Log(2)));
        _bits = new ulong[(_m + 63) / 64];
    }

    public int BitCount => _m;

    public int HashCount => _k;

    private static (uint, uint) Hashes(string s)
    {
        uint a = 2166136261, b = 0x9747B28C;
        foreach (var c in s)
        {
            a = unchecked((a ^ c) * 16777619);           // FNV-1a
            b = unchecked((b ^ c) * 0x5BD1E995); b ^= b >> 15; // a different mix
        }
        b = unchecked(b * 0x85EBCA6B) ^ (b >> 13);
        return (a, b | 1); // odd step so the k positions differ
    }

    private IEnumerable<int> Positions(string s)
    {
        var (h1, h2) = Hashes(s);
        for (uint i = 0; i < _k; i++) yield return (int)(unchecked(h1 + i * h2) % (uint)_m);
    }

    public void Add(string s)
    {
        foreach (var p in Positions(s)) _bits[p >> 6] |= 1UL << (p & 63);
    }

    public bool MightContain(string s)
    {
        foreach (var p in Positions(s))
            if ((_bits[p >> 6] & (1UL << (p & 63))) == 0) return false; // one 0 bit: definitely never added
        return true;
    }
}
