namespace Challenges.MergeSort;

public static class StableSort
{
    public static T[] Sort<T>(T[] items, Comparison<T> compare)
    {
        var a = (T[])items.Clone();
        var tmp = new T[a.Length];
        Rec(a, tmp, 0, a.Length, compare);
        return a;
    }

    private static void Rec<T>(T[] a, T[] tmp, int lo, int hi, Comparison<T> cmp)
    {
        if (hi - lo < 2) return; // 0 or 1 items: already sorted
        var mid = (lo + hi) / 2;
        Rec(a, tmp, lo, mid, cmp);
        Rec(a, tmp, mid, hi, cmp);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) tmp[k++] = cmp(a[j], a[i]) < 0 ? a[j++] : a[i++]; // ties take the left one: stable
        while (i < mid) tmp[k++] = a[i++];
        while (j < hi) tmp[k++] = a[j++];
        Array.Copy(tmp, lo, a, lo, hi - lo);
    }
}
