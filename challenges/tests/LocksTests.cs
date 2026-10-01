using Challenges.Locks;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "locks")]
public class LocksTests
{
    [Fact]
    public void First_in_first_out_on_one_thread()
    {
        var q = new BoundedQueue<string>(3);
        q.Enqueue("a");
        q.Enqueue("b");
        Assert.Equal(2, q.Count);
        Assert.Equal("a", q.Dequeue());
        Assert.Equal("b", q.Dequeue());
    }

    [Fact]
    public void Dequeue_waits_for_an_item()
    {
        var q = new BoundedQueue<int>(1);
        var got = 0;
        var consumer = new Thread(() => got = q.Dequeue());
        consumer.Start();
        Thread.Sleep(100);
        Assert.True(consumer.IsAlive, "Dequeue on an empty queue should wait");
        q.Enqueue(42);
        Assert.True(consumer.Join(3000), "the waiting consumer was never woken up");
        Assert.Equal(42, got);
    }

    [Fact]
    public void Enqueue_waits_when_full()
    {
        var q = new BoundedQueue<int>(2);
        q.Enqueue(1);
        q.Enqueue(2);
        var producer = new Thread(() => q.Enqueue(3));
        producer.Start();
        Thread.Sleep(100);
        Assert.True(producer.IsAlive, "Enqueue on a full queue should wait");
        Assert.Equal(2, q.Count);
        Assert.Equal(1, q.Dequeue());
        Assert.True(producer.Join(3000), "the waiting producer was never woken up");
        Assert.Equal(2, q.Count);
    }

    [Fact]
    public void Many_producers_and_consumers_deliver_everything_once()
    {
        const int Producers = 4, Consumers = 4, PerProducer = 20_000;
        var q = new BoundedQueue<int>(64);
        var seen = new int[Producers * PerProducer];
        Hang.Within(15_000, () =>
        {
            var ps = Enumerable.Range(0, Producers).Select(p => new Thread(() =>
            {
                for (var i = 0; i < PerProducer; i++) q.Enqueue(p * PerProducer + i);
            })).ToList();
            var cs = Enumerable.Range(0, Consumers).Select(_ => new Thread(() =>
            {
                for (var i = 0; i < PerProducer; i++) Interlocked.Increment(ref seen[q.Dequeue()]);
            })).ToList();
            ps.Concat(cs).ToList().ForEach(t => t.Start());
            ps.Concat(cs).ToList().ForEach(t => t.Join());
        }, "80,000 items through the queue");
        Assert.All(seen, n => Assert.Equal(1, n));
        Assert.Equal(0, q.Count);
    }
}
