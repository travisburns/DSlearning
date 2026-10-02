namespace Challenges.MessageQueues;

public record QueueMessage(long Id, string Body, int Deliveries);

public class MessageQueue
{
    private sealed class Entry
    {
        public required string Body;
        public int Deliveries;
        public long Deadline = -1; // -1 = waiting, otherwise in flight until this time
    }

    private readonly Func<long> _now;
    private readonly int _timeout;
    private readonly int _max;
    private readonly Dictionary<long, Entry> _messages = new();
    private readonly SortedSet<long> _waiting = new();
    private readonly PriorityQueue<long, (long Deadline, long Id)> _deadlines = new();
    private readonly List<QueueMessage> _dead = new();
    private int _inFlight;
    private long _nextId = 1;

    public MessageQueue(Func<long> nowMs, int visibilityTimeoutMs, int maxDeliveries)
    {
        _now = nowMs;
        _timeout = visibilityTimeoutMs;
        _max = maxDeliveries;
    }

    private void Expire()
    {
        var now = _now();
        while (_deadlines.TryPeek(out var id, out var at) && at.Deadline <= now)
        {
            _deadlines.Dequeue();
            // Skip stale entries: acked, or re-delivered with a newer deadline.
            if (!_messages.TryGetValue(id, out var e) || e.Deadline != at.Deadline) continue;
            _inFlight--;
            e.Deadline = -1;
            if (e.Deliveries >= _max)
            {
                _messages.Remove(id);
                _dead.Add(new QueueMessage(id, e.Body, e.Deliveries));
            }
            else _waiting.Add(id);
        }
    }

    public int Waiting
    {
        get
        {
            Expire();
            return _waiting.Count;
        }
    }

    public int InFlight
    {
        get
        {
            Expire();
            return _inFlight;
        }
    }

    public IReadOnlyList<QueueMessage> DeadLetters
    {
        get
        {
            Expire();
            return _dead;
        }
    }

    public long Send(string body)
    {
        Expire();
        var id = _nextId++;
        _messages[id] = new Entry { Body = body };
        _waiting.Add(id);
        return id;
    }

    public QueueMessage? Receive()
    {
        Expire();
        if (_waiting.Count == 0) return null;
        var id = _waiting.Min;
        _waiting.Remove(id);
        var e = _messages[id];
        e.Deliveries++;
        e.Deadline = _now() + _timeout;
        _deadlines.Enqueue(id, (e.Deadline, id));
        _inFlight++;
        return new QueueMessage(id, e.Body, e.Deliveries);
    }

    public bool Ack(long id)
    {
        Expire();
        if (!_messages.TryGetValue(id, out var e) || e.Deadline < 0) return false;
        _messages.Remove(id);
        _inFlight--;
        return true;
    }
}
