using Challenges.Scheduling;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "scheduling")]
public class SchedulingTests
{
    private static readonly List<Job> Jobs = new() { new("A", 0, 8), new("B", 1, 4), new("C", 2, 9), new("D", 3, 5) };

    [Fact]
    public void First_come_first_served()
    {
        var f = Scheduler.Fcfs(Jobs);
        Assert.Equal(new Dictionary<string, int> { ["A"] = 8, ["B"] = 12, ["C"] = 21, ["D"] = 26 }, f);
        Assert.Equal(8.75, Scheduler.AverageWait(Jobs, f));
    }

    [Fact]
    public void Shortest_job_first()
    {
        var f = Scheduler.Sjf(Jobs);
        Assert.Equal(new Dictionary<string, int> { ["A"] = 8, ["B"] = 12, ["D"] = 17, ["C"] = 26 }, f);
        Assert.Equal(7.75, Scheduler.AverageWait(Jobs, f));
    }

    [Fact]
    public void Round_robin()
    {
        var f = Scheduler.RoundRobin(Jobs, 4);
        Assert.Equal(new Dictionary<string, int> { ["A"] = 20, ["B"] = 8, ["C"] = 26, ["D"] = 25 }, f);
    }

    [Fact]
    public void Idle_gaps()
    {
        var jobs = new List<Job> { new("X", 5, 2), new("Y", 20, 3) };
        Assert.Equal(new Dictionary<string, int> { ["X"] = 7, ["Y"] = 23 }, Scheduler.Fcfs(jobs));
        Assert.Equal(new Dictionary<string, int> { ["X"] = 7, ["Y"] = 23 }, Scheduler.Sjf(jobs));
        Assert.Equal(new Dictionary<string, int> { ["X"] = 7, ["Y"] = 23 }, Scheduler.RoundRobin(jobs, 1));
    }
}
