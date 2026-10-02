namespace Challenges.Tcp;

public record Segment(long Seq, byte[] Data);

public class TcpReceiver
{
    public long Receive(Segment s) => throw new NotImplementedException("Your code here");

    public byte[] Read() => throw new NotImplementedException();
}

public class TcpSender
{
    public TcpSender(byte[] data, int segmentSize, int window)
    {
    }

    public bool Done => throw new NotImplementedException();

    public List<Segment> Send() => throw new NotImplementedException();

    public void OnAck(long ack) => throw new NotImplementedException();

    public Segment? Retransmit() => throw new NotImplementedException();
}
