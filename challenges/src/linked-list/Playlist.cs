namespace Challenges.LinkedListChallenge;

public class Playlist
{
    private class Node(string title)
    {
        public string Title = title;
        public Node? Next;
    }

    public void AddLast(string title) => throw new NotImplementedException("Your code here");

    public bool InsertAfter(string existing, string title) => throw new NotImplementedException();

    public bool Remove(string title) => throw new NotImplementedException();

    public void Reverse() => throw new NotImplementedException();

    public List<string> Titles() => throw new NotImplementedException();
}
