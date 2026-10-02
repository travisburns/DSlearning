namespace Challenges.Branches;

public class TwoBitPredictor
{
    private readonly byte[] _table;
    private readonly long _mask;

    public TwoBitPredictor(int tableBits)
    {
        _table = new byte[1 << tableBits];
        Array.Fill(_table, (byte)1);
        _mask = (1L << tableBits) - 1;
    }

    public bool Predict(long pc) => _table[pc & _mask] >= 2;

    public void Update(long pc, bool taken)
    {
        ref var c = ref _table[pc & _mask];
        if (taken) { if (c < 3) c++; }
        else if (c > 0) c--;
    }

    public double Run(IEnumerable<(long Pc, bool Taken)> trace)
    {
        long total = 0, right = 0;
        foreach (var (pc, taken) in trace)
        {
            total++;
            if (Predict(pc) == taken) right++;
            Update(pc, taken);
        }
        return total == 0 ? 1.0 : (double)right / total;
    }
}

public static class Pipeline
{
    public static long Cycles(int stages, long instructions, long mispredictions, int penalty) =>
        instructions == 0 ? 0 : instructions + stages - 1 + mispredictions * penalty;
}
