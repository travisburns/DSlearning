namespace Challenges.HeapSorting;

public static class HeapSort
{
    public static void Sort(int[] a)
    {
        var n = a.Length;
        for (var i = n / 2 - 1; i >= 0; i--) SiftDown(a, i, n); // build a max-heap, bottom-up
        for (var end = n - 1; end > 0; end--)
        {
            (a[0], a[end]) = (a[end], a[0]); // biggest left goes to its final place
            SiftDown(a, 0, end);             // heap part shrinks by one
        }
    }

    private static void SiftDown(int[] a, int i, int size)
    {
        while (true)
        {
            int l = 2 * i + 1, r = l + 1, big = i;
            if (l < size && a[l] > a[big]) big = l;
            if (r < size && a[r] > a[big]) big = r;
            if (big == i) return;
            (a[i], a[big]) = (a[big], a[i]);
            i = big;
        }
    }
}
