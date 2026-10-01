namespace Challenges.Greedy;

public static class Rooms
{
    public static List<(int Start, int End)> MaxMeetings(List<(int Start, int End)> requests)
    {
        var accepted = new List<(int, int)>();
        var freeAt = int.MinValue;
        foreach (var m in requests.OrderBy(m => m.End)) // earliest end leaves the most room for the rest
        {
            if (m.Start < freeAt) continue;
            accepted.Add(m);
            freeAt = m.End;
        }
        return accepted;
    }

    public static int RoomsNeeded(List<(int Start, int End)> meetings)
    {
        var starts = meetings.Select(m => m.Start).OrderBy(x => x).ToArray();
        var ends = meetings.Select(m => m.End).OrderBy(x => x).ToArray();
        int inUse = 0, best = 0, e = 0;
        foreach (var s in starts)
        {
            while (e < ends.Length && ends[e] <= s) { inUse--; e++; } // meetings that ended free their room
            inUse++;
            best = Math.Max(best, inUse);
        }
        return best;
    }
}
