using System.Numerics;

namespace Challenges.SparseTable;

public class ColdestDay
{
    private readonly int[][] _t; // _t[k][i] = min of temps[i .. i + 2^k - 1]

    public ColdestDay(int[] temps)
    {
        var levels = Math.Max(1, BitOperations.Log2((uint)Math.Max(1, temps.Length)) + 1);
        _t = new int[levels][];
        _t[0] = (int[])temps.Clone();
        for (var k = 1; k < levels; k++)
        {
            var half = 1 << (k - 1);
            _t[k] = new int[temps.Length - (1 << k) + 1];
            for (var i = 0; i < _t[k].Length; i++) _t[k][i] = Math.Min(_t[k - 1][i], _t[k - 1][i + half]);
        }
    }

    public int MinBetween(int from, int to)
    {
        var k = BitOperations.Log2((uint)(to - from + 1));                 // biggest power of 2 that fits
        return Math.Min(_t[k][from], _t[k][to - (1 << k) + 1]);             // two overlapping windows cover the range
    }
}
