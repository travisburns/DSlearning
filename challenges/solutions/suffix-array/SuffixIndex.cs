namespace Challenges.SuffixArrays;

public class SuffixIndex
{
    private readonly string _text;
    private readonly int[] _sa;

    public SuffixIndex(string text)
    {
        _text = text;
        _sa = Build(text);
    }

    public int[] Array => _sa;

    /// <summary>Prefix doubling: after round k, suffixes are sorted by their first 2^k characters.</summary>
    public static int[] Build(string s)
    {
        var n = s.Length;
        var sa = Enumerable.Range(0, n).ToArray();
        var rank = s.Select(c => (int)c).ToArray();
        var tmp = new int[n];
        for (var k = 1; ; k <<= 1)
        {
            var kk = k;
            // Compare by (rank of first half, rank of the next half); a missing half sorts first.
            Comparison<int> cmp = (a, b) =>
            {
                if (rank[a] != rank[b]) return rank[a].CompareTo(rank[b]);
                int ra = a + kk < n ? rank[a + kk] : -1, rb = b + kk < n ? rank[b + kk] : -1;
                return ra.CompareTo(rb);
            };
            System.Array.Sort(sa, cmp);
            tmp[sa[0]] = 0;
            for (var i = 1; i < n; i++) tmp[sa[i]] = tmp[sa[i - 1]] + (cmp(sa[i - 1], sa[i]) < 0 ? 1 : 0);
            System.Array.Copy(tmp, rank, n);
            if (n == 0 || rank[sa[n - 1]] == n - 1) break; // all ranks distinct: fully sorted
        }
        return sa;
    }

    private int Compare(int suffix, string p)
    {
        var len = Math.Min(p.Length, _text.Length - suffix);
        var c = string.CompareOrdinal(_text, suffix, p, 0, len);
        if (c != 0) return c;
        return len < p.Length ? -1 : 0; // suffix is a proper prefix of p → it sorts before; else it starts with p
    }

    private (int Lo, int Hi) Block(string p)
    {
        int lo = 0, hi = _sa.Length;
        while (lo < hi)
        {
            var m = (lo + hi) / 2;
            if (Compare(_sa[m], p) < 0) lo = m + 1;
            else hi = m;
        }
        var start = lo;
        hi = _sa.Length;
        while (lo < hi)
        {
            var m = (lo + hi) / 2;
            if (Compare(_sa[m], p) <= 0) lo = m + 1;
            else hi = m;
        }
        return (start, lo);
    }

    public int Count(string pattern)
    {
        var (lo, hi) = Block(pattern);
        return hi - lo;
    }

    public List<int> Positions(string pattern)
    {
        var (lo, hi) = Block(pattern);
        var outp = _sa[lo..hi].ToList();
        outp.Sort();
        return outp;
    }
}
