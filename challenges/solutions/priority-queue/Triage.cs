namespace Challenges.PriorityQueues;

public class Triage
{
    // Priority = (urgency, arrival number): tuples compare item by item, so ties fall to the earlier arrival.
    private readonly PriorityQueue<string, (int Urgency, long Arrival)> _pq = new();
    private long _arrivals;

    public int Count => _pq.Count;

    public void Add(string ticketId, int priority) => _pq.Enqueue(ticketId, (priority, _arrivals++));

    public string? Next() => _pq.TryDequeue(out var id, out _) ? id : null;
}
