namespace Challenges.StaticArray;

public class SeatRow
{
    private readonly bool[] _taken;
    private int _booked;

    public SeatRow(int seats) => _taken = new bool[seats];

    public int FreeCount => _taken.Length - _booked;

    public bool Book(int seat)
    {
        if (seat < 0 || seat >= _taken.Length || _taken[seat]) return false;
        _taken[seat] = true; // O(1): index straight into the array
        _booked++;
        return true;
    }

    public bool IsFree(int seat) => seat >= 0 && seat < _taken.Length && !_taken[seat];

    public int FindBlock(int groupSize)
    {
        var run = 0;
        for (var i = 0; i < _taken.Length; i++)
        {
            run = _taken[i] ? 0 : run + 1;
            if (run == groupSize) return i - groupSize + 1;
        }
        return -1;
    }
}
