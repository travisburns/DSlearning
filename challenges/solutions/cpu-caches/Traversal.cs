namespace Challenges.Caches;

public static class Traversal
{
    public static (int Hits, int Misses) SumMatrix(CacheSim cache, int n, bool rowByRow)
    {
        cache.Reset();
        for (var i = 0; i < n; i++)
            for (var j = 0; j < n; j++)
            {
                var (r, c) = rowByRow ? (i, j) : (j, i);
                cache.Access(((long)r * n + c) * 4);
            }
        return (cache.Hits, cache.Misses);
    }
}
