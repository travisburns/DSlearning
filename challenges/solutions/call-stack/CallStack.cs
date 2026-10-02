namespace Challenges.Frames;

public class StackOverflowError(string message) : Exception(message);

public class CallStack
{
    // Frame layout, from higher to lower addresses:
    //   args[0..k-1], k, returnAddress, savedFp   <- fp points at savedFp
    //   local 0, local 1, ...                     <- below fp
    private readonly int[] _mem;
    private int _sp; // next free word is _sp - 1; empty when _sp == _mem.Length
    private int _fp = -1;
    private int _depth;

    public CallStack(int words)
    {
        _mem = new int[words];
        _sp = words;
    }

    public int Depth => _depth;

    public int WordsUsed => _mem.Length - _sp;

    private void Push(int v) => _mem[--_sp] = v;

    public void Call(int returnAddress, params int[] args)
    {
        if (_sp - (args.Length + 3) < 0) throw new StackOverflowError($"No room for a frame of {args.Length + 3} words");
        foreach (var a in args) Push(a);
        Push(args.Length);
        Push(returnAddress);
        Push(_fp);
        _fp = _sp;
        _depth++;
    }

    private void NeedFrame()
    {
        if (_depth == 0) throw new InvalidOperationException("No active call");
    }

    private int ArgCount => _mem[_fp + 2];

    public int Arg(int i)
    {
        NeedFrame();
        var k = ArgCount;
        if (i < 0 || i >= k) throw new ArgumentOutOfRangeException(nameof(i));
        return _mem[_fp + 3 + (k - 1 - i)];
    }

    private int LocalCount => _fp - _sp;

    public int AllocLocal(int initial)
    {
        NeedFrame();
        if (_sp - 1 < 0) throw new StackOverflowError("No room for a local");
        Push(initial);
        return LocalCount - 1;
    }

    private int LocalAddr(int i)
    {
        NeedFrame();
        if (i < 0 || i >= LocalCount) throw new ArgumentOutOfRangeException(nameof(i));
        return _fp - 1 - i;
    }

    public int GetLocal(int i) => _mem[LocalAddr(i)];

    public void SetLocal(int i, int value) => _mem[LocalAddr(i)] = value;

    public int Return()
    {
        NeedFrame();
        var k = ArgCount;
        var ret = _mem[_fp + 1];
        var savedFp = _mem[_fp];
        _sp = _fp + 3 + k;
        _fp = savedFp;
        _depth--;
        return ret;
    }

    public IReadOnlyList<int> Trace()
    {
        var list = new List<int>();
        for (var fp = _fp; list.Count < _depth; fp = _mem[fp]) list.Add(_mem[fp + 1]);
        return list;
    }
}
