namespace Challenges.MergeableHeaps;

public class LeftistHeap
{
    public class Node(int key)
    {
        public int Key = key;
        public int Rank = 1;
        public Node? Left, Right;
    }

    public static Node? Merge(Node? a, Node? b) => throw new NotImplementedException("Your code here");

    public int Count => throw new NotImplementedException();

    public void Push(int x) => throw new NotImplementedException();

    public int Pop() => throw new NotImplementedException();

    public int Peek() => throw new NotImplementedException();

    public void Absorb(LeftistHeap other) => throw new NotImplementedException();
}
