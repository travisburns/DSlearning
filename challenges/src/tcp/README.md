# Reliable delivery over a lossy link

**The ticket.** Our IoT devices report over a cheap radio link that drops, duplicates and reorders packets. We can't use TCP on the device, so we're building the same idea ourselves: number every byte, acknowledge, resend. Build both ends.

A `Segment(long Seq, byte[] Data)` carries the bytes starting at byte number `Seq`.

**Build** `TcpReceiver` in `Tcp.cs`:

- `long Receive(Segment s)`: accept a segment and return the ACK: the number of the next byte it expects (everything before it has arrived). Segments that arrive early are kept until the gap before them is filled. Duplicates and overlaps must not duplicate bytes.
- `byte[] Read()`: the in-order bytes that have arrived since the last `Read` (never anything after a gap).

**Build** `TcpSender` in `Tcp.cs`:

- `TcpSender(byte[] data, int segmentSize, int window)`: cut `data` into segments of `segmentSize` bytes (the last may be shorter); at most `window` segments may be unacknowledged at once.
- `List<Segment> Send()`: the next segments never sent before, as many as the window allows right now.
- `void OnAck(long ack)`: everything before `ack` has arrived; free those segments. Old or repeated ACKs change nothing.
- `Segment? Retransmit()`: on a timeout, the oldest unacknowledged segment (null if none).
- `bool Done`: every byte has been acknowledged.

**Hint.** The receiver needs the next expected byte plus a `SortedDictionary<long, byte[]>` of early segments. The sender only needs two numbers: the oldest unacknowledged byte and the next byte to send.

**Run:** `dotnet test --filter Lesson=tcp`
