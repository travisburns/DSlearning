namespace Challenges.MessageQueues;

public record QueueMessage(long Id, string Body, int Deliveries);

public class MessageQueue
{
    public MessageQueue(Func<long> nowMs, int visibilityTimeoutMs, int maxDeliveries)
    {
    }

    public int Waiting => throw new NotImplementedException("Your code here");

    public int InFlight => throw new NotImplementedException();

    public IReadOnlyList<QueueMessage> DeadLetters => throw new NotImplementedException();

    public long Send(string body) => throw new NotImplementedException();

    public QueueMessage? Receive() => throw new NotImplementedException();

    public bool Ack(long id) => throw new NotImplementedException();
}
