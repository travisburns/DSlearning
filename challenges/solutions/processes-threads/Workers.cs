namespace Challenges.ProcessesThreads;

public static class Workers
{
    public static void RunAll(IReadOnlyList<Action> jobs, int workers)
    {
        var next = -1; // shared: the index of the last job taken
        var threads = Enumerable.Range(0, workers).Select(_ => new Thread(() =>
        {
            while (true)
            {
                var i = Interlocked.Increment(ref next); // atomic: no two threads get the same index
                if (i >= jobs.Count) return;
                jobs[i]();
            }
        })).ToList();
        threads.ForEach(t => t.Start());
        threads.ForEach(t => t.Join()); // wait for all of them
    }

    public static long SumInParallel(int[] data, int threads)
    {
        var partial = new long[threads]; // one slot per thread: nothing shared while summing
        var ts = Enumerable.Range(0, threads).Select(k => new Thread(() =>
        {
            int from = (int)((long)data.Length * k / threads), to = (int)((long)data.Length * (k + 1) / threads);
            long s = 0;
            for (var i = from; i < to; i++) s += data[i];
            partial[k] = s;
        })).ToList();
        ts.ForEach(t => t.Start());
        ts.ForEach(t => t.Join());
        return partial.Sum();
    }
}
