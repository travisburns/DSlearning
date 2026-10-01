namespace Challenges.CountMin;

public class CountMinSketch(int width, int depth)
{
    private readonly long[,] _c = new long[depth, width];
    private long _total;

    public long Total => _total;

    private int Slot(string item, int row)
    {
        var h = 2166136261u ^ (uint)(row * 0x9E3779B1);
        foreach (var ch in item) h = unchecked((h ^ ch) * 16777619u);
        h ^= h >> 16;
        h = unchecked(h * 0x7FEB352Du);
        h ^= h >> 15; // finish mixing so each row behaves like an independent hash
        return (int)(h % (uint)width);
    }

    public void Add(string item, long count = 1)
    {
        for (var r = 0; r < depth; r++) _c[r, Slot(item, r)] += count;
        _total += count;
    }

    public long Estimate(string item)
    {
        var best = long.MaxValue;
        for (var r = 0; r < depth; r++) best = Math.Min(best, _c[r, Slot(item, r)]); // collisions only ever add: take the smallest
        return best;
    }
}
