namespace Challenges.FastSlowPointers;

public static class Redirects
{
    public static bool HasLoop(string start, Func<string, string?> next) => Meet(start, next) != null;

    public static string? LoopEntry(string start, Func<string, string?> next)
    {
        var meet = Meet(start, next);
        if (meet == null) return null;
        var a = start;
        var b = meet;
        while (a != b)
        {
            a = next(a)!;
            b = next(b)!;
        }
        return a;
    }

    /// <summary>Where slow and fast meet, or null if fast runs off the end.</summary>
    private static string? Meet(string start, Func<string, string?> next)
    {
        string? slow = start, fast = start;
        while (true)
        {
            slow = next(slow!);
            fast = fast == null ? null : next(fast);
            fast = fast == null ? null : next(fast);
            if (fast == null || slow == null) return null; // fast reached a real page: no loop
            if (slow == fast) return slow;                  // fast lapped slow: loop
        }
    }
}
