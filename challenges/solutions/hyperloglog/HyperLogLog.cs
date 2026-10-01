using System.Numerics;

namespace Challenges.Hll;

public class HyperLogLog(int precision = 12)
{
    private readonly byte[] _reg = new byte[1 << precision];

    private static ulong Hash(string s)
    {
        var h = 14695981039346656037UL;
        foreach (var c in s) h = unchecked((h ^ c) * 1099511628211UL); // FNV-1a 64
        h = unchecked((h ^ (h >> 30)) * 0xBF58476D1CE4E5B9UL);            // splitmix64 finish: spreads the bits
        h = unchecked((h ^ (h >> 27)) * 0x94D049BB133111EBUL);
        return h ^ (h >> 31);
    }

    public void Add(string item)
    {
        var h = Hash(item);
        var idx = (int)(h >> (64 - precision));           // first p bits pick the register
        var rest = h << precision;                         // the remaining bits
        var rank = (byte)Math.Min(BitOperations.LeadingZeroCount(rest) + 1, 64 - precision + 1);
        if (rank > _reg[idx]) _reg[idx] = rank;            // a long run of zeros is rare: evidence of many items
    }

    public long Count()
    {
        double m = _reg.Length, sum = 0;
        var zeros = 0;
        foreach (var r in _reg)
        {
            sum += Math.Pow(2, -r);
            if (r == 0) zeros++;
        }
        var alpha = 0.7213 / (1 + 1.079 / m);
        var e = alpha * m * m / sum;
        if (e <= 2.5 * m && zeros > 0) e = m * Math.Log(m / zeros); // small counts: linear counting is more accurate
        return (long)Math.Round(e);
    }

    public void Merge(HyperLogLog other)
    {
        for (var i = 0; i < _reg.Length; i++) _reg[i] = Math.Max(_reg[i], other._reg[i]);
    }
}
