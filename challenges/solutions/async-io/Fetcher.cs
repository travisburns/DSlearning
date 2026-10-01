namespace Challenges.AsyncIo;

public static class Fetcher
{
    public static async Task<string[]> FetchAllAsync(IReadOnlyList<string> urls, Func<string, Task<string>> fetch, int maxConcurrent)
    {
        using var slots = new SemaphoreSlim(maxConcurrent);
        var tasks = urls.Select(async url =>
        {
            await slots.WaitAsync(); // wait for a free slot without blocking a thread
            try
            {
                return await fetch(url);
            }
            finally
            {
                slots.Release();
            }
        }).ToList();
        return await Task.WhenAll(tasks); // results come back in the original order
    }

    public static async Task<string?> WithTimeoutAsync(Func<Task<string>> work, TimeSpan timeout)
    {
        var task = work();
        var winner = await Task.WhenAny(task, Task.Delay(timeout));
        return winner == task ? await task : null;
    }
}
