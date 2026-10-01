using Challenges.MergeableHeaps;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "mergeable-heaps")]
public class MergeableHeapsTests
{
    [Fact]
    public void Push_pop_and_absorb()
    {
        var a = new LeftistHeap();
        var b = new LeftistHeap();
        foreach (var x in new[] { 5, 1, 9 }) a.Push(x);
        foreach (var x in new[] { 4, 7, 2, 8 }) b.Push(x);
        a.Absorb(b);
        Assert.Equal(0, b.Count);
        Assert.Equal(7, a.Count);
        Assert.Equal(new[] { 1, 2, 4, 5, 7, 8, 9 }, Enumerable.Range(0, 7).Select(_ => a.Pop()));
        Assert.Throws<InvalidOperationException>(() => a.Pop());
    }

    [Fact]
    public void Rank_rule_holds_everywhere()
    {
        var h = new LeftistHeap();
        var rnd = new Random(167);
        LeftistHeap.Node? root = null;
        for (var i = 0; i < 2000; i++) root = LeftistHeap.Merge(root, new LeftistHeap.Node(rnd.Next(10_000)));
        void Check(LeftistHeap.Node? n)
        {
            if (n == null) return;
            int rl = n.Left?.Rank ?? 0, rr = n.Right?.Rank ?? 0;
            Assert.True(rl >= rr, "left rank must be at least the right rank");
            Assert.Equal(rr + 1, n.Rank);
            if (n.Left != null) Assert.True(n.Key <= n.Left.Key);
            if (n.Right != null) Assert.True(n.Key <= n.Right.Key);
            Check(n.Left);
            Check(n.Right);
        }
        Check(root);
        Assert.True((root?.Rank ?? 0) <= Math.Log2(2001) + 1, "the right spine must be short");
    }

    [Fact]
    public void Merging_big_queues_is_instant()
    {
        var big = new LeftistHeap();
        for (var i = 0; i < 200_000; i++) big.Push(i);
        Perf.Under(1500, () =>
        {
            // Pass a 200,000-job queue back and forth 2,000 times. One O(log n) merge each: instant.
            // Re-pushing every job each time would be 400 million pushes.
            for (var round = 0; round < 2000; round++)
            {
                var other = new LeftistHeap();
                other.Push(-round);
                other.Absorb(big);
                big.Absorb(other);
            }
            Assert.Equal(-1999, big.Peek());
            for (var round = 0; round < 2000; round++) big.Pop(); // remove the markers again for the next timing run
        }, "2,000 merges of a 200,000-job queue");
    }
}
