namespace Challenges.DAryHeap;

public class DHeap(int d)
{
    private readonly List<long> _a = new();

    public int Count => _a.Count;

    public int Height
    {
        get
        {
            int h = 0, i = _a.Count - 1;
            while (i > 0)
            {
                i = (i - 1) / d;
                h++;
            }
            return h;
        }
    }

    public void Push(long deadline)
    {
        _a.Add(deadline);
        var i = _a.Count - 1;
        while (i > 0 && _a[(i - 1) / d] > _a[i])
        {
            (_a[i], _a[(i - 1) / d]) = (_a[(i - 1) / d], _a[i]);
            i = (i - 1) / d;
        }
    }

    public long Peek() => _a.Count > 0 ? _a[0] : throw new InvalidOperationException("Empty");

    public long Pop()
    {
        var top = Peek();
        _a[0] = _a[^1];
        _a.RemoveAt(_a.Count - 1);
        var i = 0;
        while (true)
        {
            var best = i;
            for (var c = d * i + 1; c <= d * i + d && c < _a.Count; c++) // compare all d children
                if (_a[c] < _a[best]) best = c;
            if (best == i) break;
            (_a[i], _a[best]) = (_a[best], _a[i]);
            i = best;
        }
        return top;
    }
}
