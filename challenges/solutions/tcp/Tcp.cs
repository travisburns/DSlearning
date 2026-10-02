namespace Challenges.Tcp;

public record Segment(long Seq, byte[] Data);

public class TcpReceiver
{
    private long _next; // next byte expected
    private readonly SortedDictionary<long, byte[]> _early = new();
    private readonly List<byte> _ready = new();

    public long Receive(Segment s)
    {
        if (s.Seq + s.Data.Length > _next && s.Data.Length > 0)
        {
            if (!_early.TryGetValue(s.Seq, out var have) || have.Length < s.Data.Length) _early[s.Seq] = s.Data;
        }
        // Deliver everything that now touches the front.
        while (_early.Count > 0)
        {
            var (seq, data) = _early.First();
            if (seq > _next) break;
            _early.Remove(seq);
            var skip = (int)(_next - seq);
            if (skip < data.Length)
            {
                for (var i = skip; i < data.Length; i++) _ready.Add(data[i]);
                _next = seq + data.Length;
            }
        }
        return _next;
    }

    public byte[] Read()
    {
        var r = _ready.ToArray();
        _ready.Clear();
        return r;
    }
}

public class TcpSender
{
    private readonly byte[] _data;
    private readonly int _size;
    private readonly int _window;
    private long _base;  // oldest unacknowledged byte
    private long _next;  // next byte never sent

    public TcpSender(byte[] data, int segmentSize, int window)
    {
        _data = data;
        _size = segmentSize;
        _window = window;
    }

    public bool Done => _base >= _data.Length;

    private Segment At(long seq) => new(seq, _data[(int)seq..(int)Math.Min(seq + _size, _data.Length)]);

    public List<Segment> Send()
    {
        var sent = new List<Segment>();
        while (_next < _data.Length && _next < _base + (long)_window * _size)
        {
            sent.Add(At(_next));
            _next = Math.Min(_next + _size, _data.Length);
        }
        return sent;
    }

    public void OnAck(long ack)
    {
        if (ack <= _base) return;
        // An ACK always lands on a segment boundary we've sent; never move past what was sent.
        _base = Math.Min(ack, _next);
    }

    public Segment? Retransmit() => _base < _next ? At(_base) : null;
}
