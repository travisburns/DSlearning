using System.Text;

namespace Challenges.HashFunction;

public static class Sharding
{
    public static uint Fnv1a(string s)
    {
        var h = 2166136261u;
        foreach (var b in Encoding.UTF8.GetBytes(s))
        {
            h ^= b;                         // mix the byte in
            h = unchecked(h * 16777619u);   // spread it across all 32 bits
        }
        return h;
    }

    public static int ShardFor(string userId, int shards) => (int)(Fnv1a(userId) % (uint)shards);
}
