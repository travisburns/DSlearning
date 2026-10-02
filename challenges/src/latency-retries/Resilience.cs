namespace Challenges.Resilience;

public class TransientException(string message) : Exception(message);

public class CircuitOpenException() : Exception("Circuit is open");

public enum BreakerState { Closed, Open, HalfOpen }

public class Retrier
{
    public Retrier(int maxAttempts, int baseDelayMs, Random rng, Action<int> sleep)
    {
    }

    public T Run<T>(Func<T> op) => throw new NotImplementedException("Your code here");
}

public class CircuitBreaker
{
    public CircuitBreaker(int failureThreshold, int openMs, Func<long> nowMs)
    {
    }

    public BreakerState State => throw new NotImplementedException();

    public T Call<T>(Func<T> op) => throw new NotImplementedException();
}
