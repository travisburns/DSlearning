namespace Challenges.Quicksort;

public static class Prices
{
    private static readonly Random Rnd = new();

    public static int KthSmallest(int[] values, int k)
    {
        var a = (int[])values.Clone();
        int lo = 0, hi = a.Length - 1;
        while (true)
        {
            if (lo == hi) return a[lo];
            var p = Partition(a, lo, hi);
            if (k == p) return a[p];
            if (k < p) hi = p - 1; // only the side that contains k
            else lo = p + 1;
        }
    }

    public static double Median(int[] values)
    {
        var n = values.Length;
        if (n % 2 == 1) return KthSmallest(values, n / 2);
        return (KthSmallest(values, n / 2 - 1) + (double)KthSmallest(values, n / 2)) / 2;
    }

    /// <summary>Lomuto partition around a random pivot; returns the pivot's final index.</summary>
    private static int Partition(int[] a, int lo, int hi)
    {
        var r = Rnd.Next(lo, hi + 1);
        (a[r], a[hi]) = (a[hi], a[r]);
        var pivot = a[hi];
        var i = lo;
        for (var j = lo; j < hi; j++)
            if (a[j] < pivot)
            {
                (a[i], a[j]) = (a[j], a[i]);
                i++;
            }
        (a[i], a[hi]) = (a[hi], a[i]);
        return i;
    }
}
