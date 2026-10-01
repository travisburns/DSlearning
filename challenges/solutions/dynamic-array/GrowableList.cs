namespace Challenges.DynamicArray;

public class GrowableList<T>
{
    private T[] _items = new T[4];
    private int _count;

    public int Count => _count;

    public int Capacity => _items.Length;

    public void Add(T item)
    {
        if (_count == _items.Length)
        {
            var bigger = new T[_items.Length * 2]; // doubling makes copies rare: O(1) on average
            for (var i = 0; i < _count; i++) bigger[i] = _items[i];
            _items = bigger;
        }
        _items[_count++] = item;
    }

    public T this[int i]
    {
        get
        {
            Check(i);
            return _items[i];
        }
        set
        {
            Check(i);
            _items[i] = value;
        }
    }

    public void RemoveAt(int i)
    {
        Check(i);
        for (var k = i; k < _count - 1; k++) _items[k] = _items[k + 1];
        _count--;
        _items[_count] = default!;
    }

    private void Check(int i)
    {
        if (i < 0 || i >= _count) throw new ArgumentOutOfRangeException(nameof(i));
    }
}
