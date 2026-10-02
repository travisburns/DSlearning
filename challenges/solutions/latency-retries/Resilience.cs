namespace Challenges.Resilience;

public class TransientException(string message) : Exception(message);

public class CircuitOpenException() : Exception("Circuit is open");

public enum BreakerState { Closed, Open, HalfOpen }

public class Retrier
{
    private readonly int _max;
    private readonly int _base;
    private readonly Random _rng;
    private readonly Action<int> _sleep;

    public Retrier(int maxAttempts, int baseDelayMs, Random rng, Action<int> sleep)
    {
        _max = maxAttempts;
        _base = baseDelayMs;
        _rng = rng;
        _sleep = sleep;
    }

    public T Run<T>(Func<T> op)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return op();
            }
            catch (TransientException) when (attempt < _max)
            {
                var delay = _base * (1 << (attempt - 1));
                _sleep(delay + _rng.Next(0, delay / 2 + 1));
            }
        }
    }
}

public class CircuitBreaker
{
    private readonly int _threshold;
    private readonly int _openMs;
    private readonly Func<long> _now;
    private int _failures;
    private bool _open;
    private long _openedAt;

    public CircuitBreaker(int failureThreshold, int openMs, Func<long> nowMs)
    {
        _threshold = failureThreshold;
        _openMs = openMs;
        _now = nowMs;
    }

    public BreakerState State => !_open ? BreakerState.Closed : _now() - _openedAt >= _openMs ? BreakerState.HalfOpen : BreakerState.Open;

    public T Call<T>(Func<T> op)
    {
        var state = State;
        if (state == BreakerState.Open) throw new CircuitOpenException();
        try
        {
            var result = op();
            _open = false;
            _failures = 0;
            return result;
        }
        catch (Exception)
        {
            _failures++;
            if (state == BreakerState.HalfOpen || _failures >= _threshold)
            {
                _open = true;
                _openedAt = _now();
            }
            throw;
        }
    }
}
