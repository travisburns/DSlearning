using System.Text;

namespace Challenges.Wal;

public class WalStore
{
    public WalStore(Stream log) => throw new NotImplementedException("Your code here");

    public int Count => throw new NotImplementedException();

    public string? Get(string key) => throw new NotImplementedException();

    public void Commit(IReadOnlyDictionary<string, string?> changes) => throw new NotImplementedException();
}
