using System.Text;

namespace Challenges.ConsistentHashing;

public class HashRing
{
    public static uint Hash(string s)
    {
        var h = 2166136261u;
        foreach (var b in Encoding.UTF8.GetBytes(s)) h = unchecked((h ^ b) * 16777619u);
        return h;
    }

    public HashRing(int virtualNodes = 100) => throw new NotImplementedException("Your code here");

    public void AddServer(string name) => throw new NotImplementedException();

    public void RemoveServer(string name) => throw new NotImplementedException();

    public string ServerFor(string key) => throw new NotImplementedException();
}
