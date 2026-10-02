using System.Text;
using Challenges.Tcp;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "tcp")]
public class TcpTests
{
    private static Segment Seg(long seq, string s) => new(seq, Encoding.ASCII.GetBytes(s));

    private static string Text(byte[] b) => Encoding.ASCII.GetString(b);

    [Fact]
    public void In_order_segments_are_acked_and_delivered()
    {
        var r = new TcpReceiver();
        Assert.Equal(5, r.Receive(Seg(0, "hello")));
        Assert.Equal(11, r.Receive(Seg(5, " world")));
        Assert.Equal("hello world", Text(r.Read()));
        Assert.Equal("", Text(r.Read()));
    }

    [Fact]
    public void A_gap_holds_later_segments_until_it_is_filled()
    {
        var r = new TcpReceiver();
        Assert.Equal(3, r.Receive(Seg(0, "abc")));
        Assert.Equal(3, r.Receive(Seg(6, "ghi")));
        Assert.Equal(3, r.Receive(Seg(9, "jkl")));
        Assert.Equal("abc", Text(r.Read()));
        Assert.Equal(12, r.Receive(Seg(3, "def")));
        Assert.Equal("defghijkl", Text(r.Read()));
    }

    [Fact]
    public void Duplicates_and_overlaps_do_not_duplicate_bytes()
    {
        var r = new TcpReceiver();
        r.Receive(Seg(0, "abcd"));
        Assert.Equal(4, r.Receive(Seg(0, "abcd")));
        Assert.Equal(6, r.Receive(Seg(2, "cdef")));
        Assert.Equal(6, r.Receive(Seg(1, "bc")));
        Assert.Equal(8, r.Receive(Seg(6, "gh")));
        Assert.Equal("abcdefgh", Text(r.Read()));
    }

    [Fact]
    public void Sender_respects_the_window()
    {
        var s = new TcpSender(Encoding.ASCII.GetBytes("abcdefghij"), 3, 2);
        var first = s.Send();
        Assert.Equal(new long[] { 0, 3 }, first.Select(x => x.Seq));
        Assert.Equal("abc", Text(first[0].Data));
        Assert.Empty(s.Send());
        s.OnAck(3);
        var next = s.Send();
        Assert.Single(next);
        Assert.Equal(6, next[0].Seq);
        s.OnAck(9);
        var last = s.Send();
        Assert.Single(last);
        Assert.Equal("j", Text(last[0].Data));
        Assert.False(s.Done);
        s.OnAck(10);
        Assert.True(s.Done);
        Assert.Null(s.Retransmit());
    }

    [Fact]
    public void Old_acks_change_nothing_and_retransmit_resends_the_oldest()
    {
        var s = new TcpSender(Encoding.ASCII.GetBytes("abcdefgh"), 2, 4);
        s.Send();
        s.OnAck(4);
        s.OnAck(2);
        var r = s.Retransmit();
        Assert.NotNull(r);
        Assert.Equal(4, r!.Seq);
        Assert.Equal("ef", Text(r.Data));
    }

    [Theory]
    [InlineData(1, 0.0)]
    [InlineData(2, 0.2)]
    [InlineData(3, 0.4)]
    public void Data_survives_a_lossy_reordering_link(int seed, double loss)
    {
        var rng = new Random(seed);
        var data = new byte[5000];
        rng.NextBytes(data);
        var sender = new TcpSender(data, 100, 8);
        var receiver = new TcpReceiver();
        var got = new List<byte>();
        for (var round = 0; round < 5000 && !sender.Done; round++)
        {
            var batch = sender.Send();
            if (batch.Count == 0 && sender.Retransmit() is { } again) batch.Add(again); // timeout
            // The link loses some, duplicates some and shuffles the rest.
            var wire = new List<Segment>();
            foreach (var seg in batch)
            {
                if (rng.NextDouble() < loss) continue;
                wire.Add(seg);
                if (rng.NextDouble() < 0.1) wire.Add(seg);
            }
            foreach (var seg in wire.OrderBy(_ => rng.Next()))
            {
                var ack = receiver.Receive(seg);
                if (rng.NextDouble() >= loss) sender.OnAck(ack);
            }
            got.AddRange(receiver.Read());
        }
        Assert.True(sender.Done, "The sender never finished: lost segments must be retransmitted.");
        Assert.Equal(data, got.ToArray());
    }
}
