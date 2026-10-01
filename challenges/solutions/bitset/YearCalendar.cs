using System.Numerics;

namespace Challenges.Bitset;

public class YearCalendar
{
    public const int Days = 365;
    private readonly ulong[] _w = new ulong[(Days + 63) / 64];

    public int BookedCount => _w.Sum(x => BitOperations.PopCount(x));

    public void Book(int day) => _w[day / 64] |= 1UL << (day % 64);

    public void Free(int day) => _w[day / 64] &= ~(1UL << (day % 64));

    public bool IsBooked(int day) => (_w[day / 64] & (1UL << (day % 64))) != 0;

    public YearCalendar BookedByEither(YearCalendar other)
    {
        var c = new YearCalendar();
        for (var i = 0; i < _w.Length; i++) c._w[i] = _w[i] | other._w[i]; // 64 days per instruction
        return c;
    }

    public List<int> FreeInBoth(YearCalendar other)
    {
        var either = BookedByEither(other);
        var days = new List<int>();
        for (var d = 0; d < Days; d++) if (!either.IsBooked(d)) days.Add(d);
        return days;
    }
}
