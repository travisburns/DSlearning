namespace Challenges.Deadlocks;

public class Bank
{
    private readonly long[] _balance;
    private readonly object[] _locks;

    public Bank(int accounts, long startingBalance)
    {
        _balance = Enumerable.Repeat(startingBalance, accounts).ToArray();
        _locks = Enumerable.Range(0, accounts).Select(_ => new object()).ToArray();
    }

    public long Balance(int id)
    {
        lock (_locks[id]) return _balance[id];
    }

    public long Total()
    {
        // Take every lock in id order, so the total is a consistent snapshot (and still deadlock-free).
        var taken = 0;
        try
        {
            for (; taken < _locks.Length; taken++) Monitor.Enter(_locks[taken]);
            return _balance.Sum();
        }
        finally
        {
            for (var i = taken - 1; i >= 0; i--) Monitor.Exit(_locks[i]);
        }
    }

    public bool Transfer(int from, int to, long amount)
    {
        if (from == to) return false;
        var (first, second) = from < to ? (from, to) : (to, from); // one global order: lower id first
        lock (_locks[first])
        lock (_locks[second])
        {
            if (_balance[from] < amount) return false;
            _balance[from] -= amount;
            _balance[to] += amount;
            return true;
        }
    }

    public static List<string>? FindDeadlock(Dictionary<string, string> waitsFor)
    {
        foreach (var start in waitsFor.Keys)
        {
            var path = new List<string>();
            var at = new Dictionary<string, int>();
            var cur = start;
            while (cur != null && !at.ContainsKey(cur))
            {
                at[cur] = path.Count;
                path.Add(cur);
                cur = waitsFor.TryGetValue(cur, out var next) ? next : null!;
            }
            if (cur != null) return path.GetRange(at[cur], path.Count - at[cur]); // walked back into our own path: a cycle
        }
        return null;
    }
}
