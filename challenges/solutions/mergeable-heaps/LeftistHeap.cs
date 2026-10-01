namespace Challenges.MergeableHeaps;

public class LeftistHeap
{
    public class Node(int key)
    {
        public int Key = key;
        public int Rank = 1;
        public Node? Left, Right;
    }

    private Node? _root;
    private int _count;

    private static int Rank(Node? n) => n?.Rank ?? 0;

    public static Node? Merge(Node? a, Node? b)
    {
        if (a == null) return b;
        if (b == null) return a;
        if (b.Key < a.Key) (a, b) = (b, a);   // smaller root stays on top
        a.Right = Merge(a.Right, b);           // work only along the right spine
        if (Rank(a.Right) > Rank(a.Left)) (a.Left, a.Right) = (a.Right, a.Left); // keep the right spine the short one
        a.Rank = Rank(a.Right) + 1;
        return a;
    }

    public int Count => _count;

    public void Push(int x)
    {
        _root = Merge(_root, new Node(x));
        _count++;
    }

    public int Peek() => _root?.Key ?? throw new InvalidOperationException("Empty");

    public int Pop()
    {
        var top = Peek();
        _root = Merge(_root!.Left, _root.Right);
        _count--;
        return top;
    }

    public void Absorb(LeftistHeap other)
    {
        _root = Merge(_root, other._root); // one O(log n) merge, however many jobs
        _count += other._count;
        other._root = null;
        other._count = 0;
    }
}
