namespace Challenges.CircularLinkedList;

public class RoundRobin
{
    private class Node(string task)
    {
        public string Task = task;
        public Node Next = null!;
    }

    private Node? _prev; // the node just before the current turn (so we can insert and remove easily)
    private int _count;

    public int Count => _count;

    public void Add(string task)
    {
        var n = new Node(task);
        if (_prev == null)
        {
            n.Next = n; // a circle of one
            _prev = n;
        }
        else
        {
            n.Next = _prev.Next; // goes just before the current one = last in the cycle
            _prev.Next = n;
            _prev = n;
        }
        _count++;
    }

    public string Next()
    {
        if (_prev == null) throw new InvalidOperationException("No tasks");
        var cur = _prev.Next;
        _prev = cur; // move on; wrapping round needs no special case
        return cur.Task;
    }

    public bool Finish(string task)
    {
        if (_prev == null) return false;
        var p = _prev;
        for (var i = 0; i < _count; i++, p = p.Next)
        {
            if (p.Next.Task != task) continue;
            if (_count == 1) _prev = null;
            else
            {
                if (p.Next == _prev) _prev = p;
                p.Next = p.Next.Next;
            }
            _count--;
            return true;
        }
        return false;
    }
}
