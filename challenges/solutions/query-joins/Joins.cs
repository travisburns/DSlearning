namespace Challenges.QueryJoins;

public static class Joins
{
    public static List<(TL Left, TR Right)> HashJoin<TL, TR, TKey>(IEnumerable<TL> left, IEnumerable<TR> right, Func<TL, TKey> leftKey, Func<TR, TKey> rightKey)
        where TKey : notnull
    {
        var table = new Dictionary<TKey, List<TL>>(); // build side
        foreach (var l in left)
        {
            var k = leftKey(l);
            if (!table.TryGetValue(k, out var list)) table[k] = list = new List<TL>();
            list.Add(l);
        }
        var outp = new List<(TL, TR)>();
        foreach (var r in right) // probe side: one lookup per row
            if (table.TryGetValue(rightKey(r), out var matches))
                foreach (var l in matches) outp.Add((l, r));
        return outp;
    }

    public static List<(TL Left, TR? Right)> LeftJoin<TL, TR, TKey>(IEnumerable<TL> left, IEnumerable<TR> right, Func<TL, TKey> leftKey, Func<TR, TKey> rightKey)
        where TKey : notnull
    {
        var table = new Dictionary<TKey, List<TR>>(); // build on the right, so we can walk the left in order
        foreach (var r in right)
        {
            var k = rightKey(r);
            if (!table.TryGetValue(k, out var list)) table[k] = list = new List<TR>();
            list.Add(r);
        }
        var outp = new List<(TL, TR?)>();
        foreach (var l in left)
            if (table.TryGetValue(leftKey(l), out var matches))
                foreach (var r in matches) outp.Add((l, r));
            else outp.Add((l, default)); // no match: keep the left row with an empty right side
        return outp;
    }
}
