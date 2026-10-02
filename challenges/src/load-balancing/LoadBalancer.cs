namespace Challenges.Balancing;

public class LoadBalancer
{
    public LoadBalancer(IReadOnlyList<string> servers, int failuresToMarkDown)
    {
    }

    public string? NextRoundRobin() => throw new NotImplementedException("Your code here");

    public string? Acquire() => throw new NotImplementedException();

    public void Release(string server) => throw new NotImplementedException();

    public int InProgress(string server) => throw new NotImplementedException();

    public void ReportHealth(string server, bool ok) => throw new NotImplementedException();

    public bool IsUp(string server) => throw new NotImplementedException();
}
