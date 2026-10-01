namespace Challenges.Locks;

public class BoundedQueue<T>(int capacity)
{
    private readonly Queue<T> _items = new();
    private readonly object _gate = new();

    public int Count
    {
        get
        {
            lock (_gate) return _items.Count;
        }
    }

    public void Enqueue(T item)
    {
        lock (_gate)
        {
            while (_items.Count >= capacity) Monitor.Wait(_gate); // releases the lock while waiting, re-takes it on wake
            _items.Enqueue(item);
            Monitor.PulseAll(_gate); // wake any consumers waiting for an item
        }
    }

    public T Dequeue()
    {
        lock (_gate)
        {
            while (_items.Count == 0) Monitor.Wait(_gate);
            var item = _items.Dequeue();
            Monitor.PulseAll(_gate); // wake any producers waiting for space
            return item;
        }
    }
}
