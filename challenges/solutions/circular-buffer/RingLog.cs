namespace Challenges.CircularBuffer;

public class RingLog(int capacity)
{
    private readonly string[] _buf = new string[capacity];
    private int _head; // index of the oldest line
    private int _count;

    public int Count => _count;

    public void Add(string line)
    {
        var tail = (_head + _count) % _buf.Length;
        _buf[tail] = line;
        if (_count < _buf.Length) _count++;
        else _head = (_head + 1) % _buf.Length; // full: we just overwrote the oldest, so the oldest moves on
    }

    public List<string> Lines()
    {
        var outp = new List<string>(_count);
        for (var i = 0; i < _count; i++) outp.Add(_buf[(_head + i) % _buf.Length]);
        return outp;
    }
}
