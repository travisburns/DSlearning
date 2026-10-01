namespace Challenges.LinkedListChallenge;

public class Playlist
{
    private class Node(string title)
    {
        public string Title = title;
        public Node? Next;
    }

    private Node? _head;
    private Node? _tail;

    public void AddLast(string title)
    {
        var n = new Node(title);
        if (_tail == null) _head = _tail = n;
        else
        {
            _tail.Next = n;
            _tail = n;
        }
    }

    public bool InsertAfter(string existing, string title)
    {
        for (var cur = _head; cur != null; cur = cur.Next)
        {
            if (cur.Title != existing) continue;
            var n = new Node(title) { Next = cur.Next }; // new node points at the old next first…
            cur.Next = n;                                // …then cur points at the new node
            if (_tail == cur) _tail = n;
            return true;
        }
        return false;
    }

    public bool Remove(string title)
    {
        Node? prev = null;
        for (var cur = _head; cur != null; prev = cur, cur = cur.Next)
        {
            if (cur.Title != title) continue;
            if (prev == null) _head = cur.Next;
            else prev.Next = cur.Next; // skip over cur
            if (_tail == cur) _tail = prev;
            return true;
        }
        return false;
    }

    public void Reverse()
    {
        Node? prev = null;
        var cur = _head;
        _tail = _head;
        while (cur != null)
        {
            var next = cur.Next;
            cur.Next = prev; // flip one arrow
            prev = cur;
            cur = next;
        }
        _head = prev;
    }

    public List<string> Titles()
    {
        var outp = new List<string>();
        for (var cur = _head; cur != null; cur = cur.Next) outp.Add(cur.Title);
        return outp;
    }
}
