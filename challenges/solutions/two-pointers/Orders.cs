namespace Challenges.TwoPointers;

public static class Orders
{
    public static List<int> MergeUnique(int[] a, int[] b)
    {
        var outp = new List<int>(a.Length + b.Length);
        int i = 0, j = 0;
        void Push(int v)
        {
            if (outp.Count == 0 || outp[^1] != v) outp.Add(v); // input is sorted, so duplicates are neighbours
        }
        while (i < a.Length || j < b.Length)
        {
            if (j >= b.Length || (i < a.Length && a[i] <= b[j])) Push(a[i++]);
            else Push(b[j++]);
        }
        return outp;
    }

    public static (int, int)? PairForBudget(int[] sortedPrices, int budget)
    {
        int l = 0, r = sortedPrices.Length - 1;
        while (l < r)
        {
            var sum = sortedPrices[l] + sortedPrices[r];
            if (sum == budget) return (l, r);
            if (sum < budget) l++; // need more: the smallest can't pair with anything left
            else r--;              // need less: the largest can't pair with anything left
        }
        return null;
    }
}
