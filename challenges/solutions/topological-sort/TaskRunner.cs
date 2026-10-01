namespace Challenges.TopologicalSort;

public static class TaskRunner
{
    public static List<string> Order(Dictionary<string, List<string>> dependsOn)
    {
        var waiting = new Dictionary<string, int>();             // task → unfinished dependencies
        var unlocks = new Dictionary<string, List<string>>();    // dependency → tasks waiting on it
        void Ensure(string t)
        {
            waiting.TryAdd(t, 0);
            unlocks.TryAdd(t, new List<string>());
        }
        foreach (var (task, deps) in dependsOn)
        {
            Ensure(task);
            foreach (var d in deps)
            {
                Ensure(d);
                waiting[task]++;
                unlocks[d].Add(task);
            }
        }
        var ready = new PriorityQueue<string, string>(StringComparer.Ordinal);
        foreach (var (t, n) in waiting) if (n == 0) ready.Enqueue(t, t);
        var order = new List<string>(waiting.Count);
        while (ready.TryDequeue(out var t, out _))
        {
            order.Add(t);
            foreach (var next in unlocks[t])
                if (--waiting[next] == 0) ready.Enqueue(next, next);
        }
        if (order.Count != waiting.Count) throw new InvalidOperationException("Circular dependency between: " + string.Join(", ", waiting.Where(kv => kv.Value > 0).Select(kv => kv.Key)));
        return order;
    }
}
