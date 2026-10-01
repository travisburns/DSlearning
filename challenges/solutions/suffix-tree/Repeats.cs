namespace Challenges.SuffixTrees;

public static class Repeats
{
    public static string LongestRepeat(string text)
    {
        var sa = SuffixArray(text);
        var lcp = Lcp(text, sa);
        var best = "";
        for (var i = 1; i < sa.Length; i++)
        {
            if (lcp[i] < best.Length || lcp[i] == 0) continue;
            var cand = text.Substring(sa[i], lcp[i]);
            if (cand.Length > best.Length || string.CompareOrdinal(cand, best) < 0) best = cand;
        }
        return best;
    }

    public static long DistinctSubstrings(string text)
    {
        var sa = SuffixArray(text);
        var lcp = Lcp(text, sa);
        long total = 0;
        for (var i = 0; i < sa.Length; i++) total += text.Length - sa[i] - lcp[i]; // new prefixes this suffix adds
        return total;
    }

    /// <summary>lcp[i] = longest common prefix of the suffixes at sa[i-1] and sa[i] (Kasai, O(n)).</summary>
    private static int[] Lcp(string s, int[] sa)
    {
        var n = s.Length;
        var rank = new int[n];
        for (var i = 0; i < n; i++) rank[sa[i]] = i;
        var lcp = new int[n];
        var h = 0;
        for (var i = 0; i < n; i++)
        {
            if (rank[i] == 0)
            {
                h = 0;
                continue;
            }
            var j = sa[rank[i] - 1];
            while (i + h < n && j + h < n && s[i + h] == s[j + h]) h++;
            lcp[rank[i]] = h;
            if (h > 0) h--; // the next suffix shares at least h - 1
        }
        return lcp;
    }

    private static int[] SuffixArray(string s)
    {
        var n = s.Length;
        var sa = Enumerable.Range(0, n).ToArray();
        var rank = s.Select(c => (int)c).ToArray();
        var tmp = new int[n];
        for (var k = 1; n > 0; k <<= 1)
        {
            var kk = k;
            Comparison<int> cmp = (a, b) =>
            {
                if (rank[a] != rank[b]) return rank[a].CompareTo(rank[b]);
                int ra = a + kk < n ? rank[a + kk] : -1, rb = b + kk < n ? rank[b + kk] : -1;
                return ra.CompareTo(rb);
            };
            Array.Sort(sa, cmp);
            tmp[sa[0]] = 0;
            for (var i = 1; i < n; i++) tmp[sa[i]] = tmp[sa[i - 1]] + (cmp(sa[i - 1], sa[i]) < 0 ? 1 : 0);
            Array.Copy(tmp, rank, n);
            if (rank[sa[n - 1]] == n - 1) break;
        }
        return sa;
    }
}
