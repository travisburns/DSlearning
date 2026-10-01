using Xunit;

namespace Challenges.Tests;

/// <summary>Runs concurrent code with a deadline, so a deadlock or a missed wake-up fails the test instead of hanging it.</summary>
public static class Hang
{
    public static void Within(int ms, Action work, string what)
    {
        var t = Task.Run(work);
        if (!t.Wait(TimeSpan.FromMilliseconds(ms)) && !t.IsFaulted)
            Assert.Fail($"{what} did not finish within {ms} ms. Threads are probably stuck waiting for each other (a deadlock, or a waiter nobody wakes up).");
        t.GetAwaiter().GetResult();
    }
}
