namespace Challenges.Memory;

public class MemoryArena
{
    private readonly byte[] _mem;
    private int _next;

    public MemoryArena(int size) => _mem = new byte[size];

    public int Used => _next;

    public int Allocate(int bytes)
    {
        if (bytes < 0 || _next + bytes > _mem.Length) throw new OutOfMemoryException("Arena is full");
        var address = _next;
        _next += bytes; // bump the pointer: the next piece starts right after this one
        return address;
    }

    public void Write(int address, byte value) => _mem[address] = value;

    public byte Read(int address) => _mem[address];

    public void Reset() => _next = 0; // O(1): old bytes are simply overwritten later
}
