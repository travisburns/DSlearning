namespace Challenges.RedBlack;

public class RoomCalendar
{
    // Ordered by start time. SortedSet is a red-black tree: every operation below is O(log n).
    private readonly SortedSet<(int Start, int End)> _bookings = new(Comparer<(int Start, int End)>.Create((a, b) => a.Start.CompareTo(b.Start)));

    public int Count => _bookings.Count;

    public bool Book(int start, int end)
    {
        // Only the nearest booking on each side can overlap. Careful: Count on a view is O(n), so never call it here;
        // just read the first item from each side (O(log n)).
        foreach (var b in _bookings.GetViewBetween((int.MinValue, 0), (start, 0)).Reverse()) // starts ≤ start, latest first
        {
            if (b.End > start) return false;
            break;
        }
        foreach (var a in _bookings.GetViewBetween((start, 0), (int.MaxValue, 0)))          // starts ≥ start, earliest first
        {
            if (a.Start < end) return false;
            break;
        }
        _bookings.Add((start, end));
        return true;
    }

    public List<(int Start, int End)> Between(int from, int to) =>
        to <= from ? new() : _bookings.GetViewBetween((from, 0), (to - 1, 0)).ToList();
}
