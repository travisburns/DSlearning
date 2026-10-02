using Challenges.MessageQueues;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "message-queues")]
public class MessageQueuesTests
{
    private long _now;

    [Fact]
    public void Fifo_receive_and_ack()
    {
        var q = new MessageQueue(() => _now, 30_000, 5);
        Assert.Equal(1, q.Send("email:ann"));
        Assert.Equal(2, q.Send("email:bob"));
        var m = q.Receive()!;
        Assert.Equal(new QueueMessage(1, "email:ann", 1), m);
        Assert.Equal(1, q.Waiting);
        Assert.Equal(1, q.InFlight);
        Assert.True(q.Ack(1));
        Assert.False(q.Ack(1));
        Assert.Equal(0, q.InFlight);
        Assert.Equal("email:bob", q.Receive()!.Body);
        Assert.Null(q.Receive());
    }

    [Fact]
    public void In_flight_messages_are_hidden_from_other_workers()
    {
        var q = new MessageQueue(() => _now, 1000, 5);
        q.Send("a");
        Assert.NotNull(q.Receive());
        _now += 999;
        Assert.Null(q.Receive());
        Assert.False(q.Ack(99));
    }

    [Fact]
    public void Unacked_messages_come_back_first()
    {
        var q = new MessageQueue(() => _now, 1000, 5);
        q.Send("a");
        q.Send("b");
        q.Receive(); // a, and the worker crashes
        _now += 1000;
        Assert.Equal(2, q.Waiting);
        var again = q.Receive()!;
        Assert.Equal(new QueueMessage(1, "a", 2), again);
        Assert.True(q.Ack(1));
        Assert.Equal("b", q.Receive()!.Body);
    }

    [Fact]
    public void A_late_ack_fails()
    {
        var q = new MessageQueue(() => _now, 1000, 5);
        q.Send("a");
        q.Receive();
        _now += 1500;
        Assert.False(q.Ack(1));
        Assert.Equal(1, q.Waiting);
        var m = q.Receive()!;
        Assert.Equal(2, m.Deliveries);
        Assert.True(q.Ack(1));
    }

    [Fact]
    public void Poison_messages_go_to_dead_letters()
    {
        var q = new MessageQueue(() => _now, 100, 3);
        q.Send("poison");
        q.Send("fine");
        for (var i = 0; i < 3; i++)
        {
            var m = q.Receive()!;
            Assert.Equal("poison", m.Body);
            Assert.Equal(i + 1, m.Deliveries);
            _now += 100;
        }
        Assert.Single(q.DeadLetters);
        Assert.Equal(new QueueMessage(1, "poison", 3), q.DeadLetters[0]);
        Assert.Equal("fine", q.Receive()!.Body);
        Assert.Equal(0, q.Waiting);
    }

    [Fact]
    public void Matches_a_simple_model()
    {
        var rng = new Random(11);
        var q = new MessageQueue(() => _now, 50, 3);
        var model = new Dictionary<long, (string Body, int Deliveries, long Deadline)>();
        var dead = new List<long>();
        void Expire()
        {
            foreach (var (id, m) in model.Where(kv => kv.Value.Deadline >= 0 && kv.Value.Deadline <= _now).OrderBy(kv => kv.Value.Deadline).ThenBy(kv => kv.Key).ToList())
            {
                if (m.Deliveries >= 3)
                {
                    model.Remove(id);
                    dead.Add(id);
                }
                else model[id] = (m.Body, m.Deliveries, -1);
            }
        }
        var held = new List<long>();
        for (var step = 0; step < 3000; step++)
        {
            _now += rng.Next(0, 20);
            Expire();
            switch (rng.Next(4))
            {
                case 0:
                    var sent = q.Send($"job{step}");
                    model[sent] = ($"job{step}", 0, -1);
                    break;
                case 1:
                    var got = q.Receive();
                    var want = model.Where(kv => kv.Value.Deadline < 0).Select(kv => kv.Key).DefaultIfEmpty(-1).Min();
                    if (want < 0) Assert.Null(got);
                    else
                    {
                        var m = model[want];
                        model[want] = (m.Body, m.Deliveries + 1, _now + 50);
                        Assert.Equal(new QueueMessage(want, m.Body, m.Deliveries + 1), got);
                        held.Add(want);
                    }
                    break;
                default:
                    if (held.Count == 0) break;
                    var k = held[rng.Next(held.Count)];
                    held.Remove(k);
                    var ok = model.TryGetValue(k, out var e) && e.Deadline >= 0;
                    Assert.Equal(ok, q.Ack(k));
                    if (ok) model.Remove(k);
                    break;
            }
            Assert.Equal(model.Count(kv => kv.Value.Deadline < 0), q.Waiting);
            Assert.Equal(model.Count(kv => kv.Value.Deadline >= 0), q.InFlight);
        }
        Assert.Equal(dead, q.DeadLetters.Select(d => d.Id));
    }

    [Fact]
    public void Large_queues_are_fast()
    {
        Perf.Under(1500, () =>
        {
            long now = 0;
            var q = new MessageQueue(() => now, 1000, 3);
            for (var i = 0; i < 200_000; i++) q.Send("x");
            var n = 0;
            while (q.Receive() is { } m)
            {
                now++;
                if (m.Id % 10 != 0) q.Ack(m.Id); // every 10th worker "crashes"
                n++;
            }
            Assert.True(n >= 200_000);
        }, "200,000 messages through the queue");
    }
}
