namespace Challenges.Mvcc;

public class MvccStore
{
    public Tx Begin() => throw new NotImplementedException("Your code here");

    public int VersionCount(string key) => throw new NotImplementedException();

    public class Tx
    {
        public string? Read(string key) => throw new NotImplementedException();

        public void Write(string key, string? value) => throw new NotImplementedException();

        public bool Commit() => throw new NotImplementedException();
    }
}
