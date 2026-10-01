namespace Challenges.AsyncIo;

public static class Fetcher
{
    public static Task<string[]> FetchAllAsync(IReadOnlyList<string> urls, Func<string, Task<string>> fetch, int maxConcurrent) =>
        throw new NotImplementedException("Your code here");

    public static Task<string?> WithTimeoutAsync(Func<Task<string>> work, TimeSpan timeout) => throw new NotImplementedException();
}
