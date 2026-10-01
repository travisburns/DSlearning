using System.Text;

namespace Challenges.Ropes;

/// <summary>An implicit treap: in-order position = size of everything to the left. Split and merge do all the work.</summary>
public class Rope
{
    private class Node(char c, int pri)
    {
        public readonly char C = c;
        public readonly int Pri = pri;
        public Node? L, R;
        public int Size = 1;
    }

    private static readonly Random Rnd = new(7);
    private Node? _root;

    public Rope(string text) => _root = Build(text, 0, text.Length - 1, int.MaxValue);

    /// <summary>Balanced build; priorities shrink with depth so the heap order holds.</summary>
    private static Node? Build(string s, int lo, int hi, int maxPri)
    {
        if (lo > hi) return null;
        var mid = (lo + hi) / 2;
        var n = new Node(s[mid], maxPri);
        n.L = Build(s, lo, mid - 1, maxPri - 1 - Rnd.Next(4));
        n.R = Build(s, mid + 1, hi, maxPri - 1 - Rnd.Next(4));
        Up(n);
        return n;
    }

    private static int Sz(Node? n) => n?.Size ?? 0;

    private static void Up(Node n) => n.Size = 1 + Sz(n.L) + Sz(n.R);

    /// <summary>First k characters, and the rest.</summary>
    private static (Node?, Node?) Split(Node? n, int k)
    {
        if (n == null) return (null, null);
        if (Sz(n.L) >= k)
        {
            var (a, b) = Split(n.L, k);
            n.L = b;
            Up(n);
            return (a, n);
        }
        else
        {
            var (a, b) = Split(n.R, k - Sz(n.L) - 1);
            n.R = a;
            Up(n);
            return (n, b);
        }
    }

    private static Node? Merge(Node? a, Node? b)
    {
        if (a == null) return b;
        if (b == null) return a;
        if (a.Pri > b.Pri)
        {
            a.R = Merge(a.R, b);
            Up(a);
            return a;
        }
        b.L = Merge(a, b.L);
        Up(b);
        return b;
    }

    public int Length => Sz(_root);

    public char CharAt(int i)
    {
        var n = _root;
        while (true)
        {
            var left = Sz(n!.L);
            if (i < left) n = n.L;
            else if (i == left) return n.C;
            else
            {
                i -= left + 1;
                n = n.R;
            }
        }
    }

    public void Insert(int index, string s)
    {
        var (a, b) = Split(_root, index);
        Node? mid = null;
        foreach (var c in s) mid = Merge(mid, new Node(c, Rnd.Next(int.MaxValue / 2)));
        _root = Merge(Merge(a, mid), b);
    }

    public void Delete(int index, int count)
    {
        var (a, rest) = Split(_root, index);
        var (_, c) = Split(rest, count); // drop the middle piece
        _root = Merge(a, c);
    }

    public override string ToString()
    {
        var sb = new StringBuilder(Length);
        var stack = new Stack<Node>();
        var n = _root;
        while (n != null || stack.Count > 0)
        {
            while (n != null)
            {
                stack.Push(n);
                n = n.L;
            }
            n = stack.Pop();
            sb.Append(n.C);
            n = n.R;
        }
        return sb.ToString();
    }
}
