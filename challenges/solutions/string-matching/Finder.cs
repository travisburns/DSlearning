namespace Challenges.StringMatching;

public static class Finder
{
    private const ulong B = 257, M = 1_000_000_007;

    public static List<int> FindAll(string text, string pattern)
    {
        var hits = new List<int>();
        int n = text.Length, m = pattern.Length;
        if (m == 0 || m > n) return hits;
        ulong hp = 0, ht = 0, power = 1; // power = B^(m-1): the weight of the char leaving the window
        for (var i = 0; i < m; i++)
        {
            hp = (hp * B + pattern[i]) % M;
            ht = (ht * B + text[i]) % M;
            if (i > 0) power = power * B % M;
        }
        for (var i = 0; ; i++)
        {
            if (hp == ht && Same(text, i, pattern)) hits.Add(i); // confirm: equal hashes can be a coincidence
            if (i + m >= n) break;
            ht = (ht + M * M - text[i] * power % M) % M;  // remove the left char
            ht = (ht * B + text[i + m]) % M;              // add the right char
        }
        return hits;
    }

    private static bool Same(string text, int at, string pattern)
    {
        for (var k = 0; k < pattern.Length; k++) if (text[at + k] != pattern[k]) return false;
        return true;
    }
}
