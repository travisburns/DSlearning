namespace Challenges.Graphs;

public class SocialGraph
{
    private readonly Dictionary<string, HashSet<string>> _adj = new();

    private HashSet<string> Of(string p) => _adj.TryGetValue(p, out var s) ? s : _adj[p] = new HashSet<string>();

    public void AddFriendship(string a, string b)
    {
        if (a == b) return;
        Of(a).Add(b); // undirected: record both directions
        Of(b).Add(a);
    }

    public List<string> Friends(string p) => _adj.TryGetValue(p, out var s) ? s.OrderBy(x => x, StringComparer.Ordinal).ToList() : new();

    public List<string> Mutual(string a, string b) =>
        _adj.TryGetValue(a, out var fa) && _adj.TryGetValue(b, out var fb)
            ? fa.Where(fb.Contains).OrderBy(x => x, StringComparer.Ordinal).ToList()
            : new();

    public List<string> Suggest(string p, int max)
    {
        if (!_adj.TryGetValue(p, out var mine)) return new();
        var score = new Dictionary<string, int>();
        foreach (var f in mine)
            foreach (var ff in _adj[f])
                if (ff != p && !mine.Contains(ff)) score[ff] = score.GetValueOrDefault(ff) + 1; // one more mutual friend
        return score.OrderByDescending(kv => kv.Value).ThenBy(kv => kv.Key, StringComparer.Ordinal).Take(max).Select(kv => kv.Key).ToList();
    }
}
