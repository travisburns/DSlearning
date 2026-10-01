namespace Challenges.Lru;

public class LruCache<TKey, TValue> where TKey : notnull
{
    public LruCache(int capacity) => throw new NotImplementedException("Your code here");

    public int Count => throw new NotImplementedException();

    public bool TryGet(TKey key, out TValue value) => throw new NotImplementedException();

    public void Put(TKey key, TValue value) => throw new NotImplementedException();

    public TValue GetOrAdd(TKey key, Func<TKey, TValue> load) => throw new NotImplementedException();
}
