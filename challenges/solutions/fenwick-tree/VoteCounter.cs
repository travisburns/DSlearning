namespace Challenges.Fenwick;

public class VoteCounter(int candidates)
{
    private readonly long[] _tree = new long[candidates + 1]; // _tree[i] covers (i - lowbit(i), i]

    public void Add(int candidate, long votes)
    {
        for (var i = candidate; i <= candidates; i += i & -i) _tree[i] += votes; // every slot covering this candidate
    }

    public long UpTo(int k)
    {
        long s = 0;
        for (var i = k; i > 0; i -= i & -i) s += _tree[i]; // jump down through disjoint ranges
        return s;
    }

    public long Between(int a, int b) => UpTo(b) - UpTo(a - 1);

    public long Votes(int candidate) => Between(candidate, candidate);
}
