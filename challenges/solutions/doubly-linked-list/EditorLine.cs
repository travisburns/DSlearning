using System.Text;

namespace Challenges.DoublyLinkedList;

public class EditorLine
{
    private class Node(char c)
    {
        public char C = c;
        public Node? Prev, Next;
    }

    private readonly Node _start = new('\0'); // sentinel: the cursor sits just after _cursor
    private Node _cursor;
    private int _pos;

    public EditorLine() => _cursor = _start;

    public int CursorPosition => _pos;

    public void Type(char c)
    {
        var n = new Node(c) { Prev = _cursor, Next = _cursor.Next };
        if (_cursor.Next != null) _cursor.Next.Prev = n;
        _cursor.Next = n;
        _cursor = n;
        _pos++;
    }

    public void Backspace()
    {
        if (_cursor == _start) return;
        var gone = _cursor;
        gone.Prev!.Next = gone.Next; // both neighbours are right here: O(1)
        if (gone.Next != null) gone.Next.Prev = gone.Prev;
        _cursor = gone.Prev;
        _pos--;
    }

    public void Left()
    {
        if (_cursor == _start) return;
        _cursor = _cursor.Prev!;
        _pos--;
    }

    public void Right()
    {
        if (_cursor.Next == null) return;
        _cursor = _cursor.Next;
        _pos++;
    }

    public string Text()
    {
        var sb = new StringBuilder();
        for (var n = _start.Next; n != null; n = n.Next) sb.Append(n.C);
        return sb.ToString();
    }
}
