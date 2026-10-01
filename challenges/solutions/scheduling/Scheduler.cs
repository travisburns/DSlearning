namespace Challenges.Scheduling;

public record Job(string Name, int Arrival, int Burst);

public static class Scheduler
{
    public static Dictionary<string, int> Fcfs(IReadOnlyList<Job> jobs)
    {
        var finish = new Dictionary<string, int>();
        var t = 0;
        foreach (var j in jobs.OrderBy(j => j.Arrival).ThenBy(j => j.Name, StringComparer.Ordinal))
        {
            t = Math.Max(t, j.Arrival) + j.Burst; // idle until it arrives, then run it to the end
            finish[j.Name] = t;
        }
        return finish;
    }

    public static Dictionary<string, int> Sjf(IReadOnlyList<Job> jobs)
    {
        var pending = jobs.OrderBy(j => j.Arrival).ThenBy(j => j.Name, StringComparer.Ordinal).ToList();
        var ready = new PriorityQueue<Job, (int, int, string)>(Comparer<(int, int, string)>.Create((a, b) =>
            a.Item1 != b.Item1 ? a.Item1.CompareTo(b.Item1) : a.Item2 != b.Item2 ? a.Item2.CompareTo(b.Item2) : string.CompareOrdinal(a.Item3, b.Item3)));
        var finish = new Dictionary<string, int>();
        int t = 0, i = 0;
        while (finish.Count < jobs.Count)
        {
            while (i < pending.Count && pending[i].Arrival <= t) ready.Enqueue(pending[i], (pending[i].Burst, pending[i].Arrival, pending[i++].Name));
            if (ready.Count == 0)
            {
                t = pending[i].Arrival; // nothing ready: jump to the next arrival
                continue;
            }
            var j = ready.Dequeue(); // shortest ready job
            t += j.Burst;
            finish[j.Name] = t;
        }
        return finish;
    }

    public static Dictionary<string, int> RoundRobin(IReadOnlyList<Job> jobs, int quantum)
    {
        var pending = jobs.OrderBy(j => j.Arrival).ThenBy(j => j.Name, StringComparer.Ordinal).ToList();
        var left = jobs.ToDictionary(j => j.Name, j => j.Burst);
        var queue = new Queue<string>();
        var finish = new Dictionary<string, int>();
        int t = 0, i = 0;
        void Arrive()
        {
            while (i < pending.Count && pending[i].Arrival <= t) queue.Enqueue(pending[i++].Name);
        }
        while (finish.Count < jobs.Count)
        {
            Arrive();
            if (queue.Count == 0)
            {
                t = pending[i].Arrival;
                continue;
            }
            var n = queue.Dequeue();
            var run = Math.Min(quantum, left[n]);
            t += run;
            left[n] -= run;
            Arrive(); // arrivals during the slice queue up before the preempted job
            if (left[n] > 0) queue.Enqueue(n);
            else finish[n] = t;
        }
        return finish;
    }

    public static double AverageWait(IReadOnlyList<Job> jobs, Dictionary<string, int> finish) =>
        jobs.Average(j => finish[j.Name] - j.Arrival - j.Burst);
}
