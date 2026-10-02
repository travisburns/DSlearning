namespace Challenges.Caching;

public class ReadThroughCache<TKey, TValue> where TKey : notnull
{
    public ReadThroughCache(Func<TKey, TValue> load, int capacity, int ttlMs, Func<long> nowMs)
    {
    }

    public int Hits => throw new NotImplementedException("Your code here");

    public int Loads => throw new NotImplementedException();

    public int Count => throw new NotImplementedException();

    public TValue Get(TKey key) => throw new NotImplementedException();

    public void Invalidate(TKey key) => throw new NotImplementedException();
}
