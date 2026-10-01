namespace Challenges.Scheduling;

public record Job(string Name, int Arrival, int Burst);

public static class Scheduler
{
    public static Dictionary<string, int> Fcfs(IReadOnlyList<Job> jobs) => throw new NotImplementedException("Your code here");

    public static Dictionary<string, int> Sjf(IReadOnlyList<Job> jobs) => throw new NotImplementedException();

    public static Dictionary<string, int> RoundRobin(IReadOnlyList<Job> jobs, int quantum) => throw new NotImplementedException();

    public static double AverageWait(IReadOnlyList<Job> jobs, Dictionary<string, int> finish) => throw new NotImplementedException();
}
