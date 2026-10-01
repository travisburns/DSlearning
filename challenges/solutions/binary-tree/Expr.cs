using System.Globalization;

namespace Challenges.BinaryTrees;

public class Node
{
    public char Op;          // '+', '-', '*', '/' for operators; '\0' for a number
    public double Value;     // used when this is a number
    public Node? Left, Right;

    public static Node Num(double v) => new() { Value = v };
    public static Node Make(char op, Node l, Node r) => new() { Op = op, Left = l, Right = r };
}

public static class Expr
{
    private static bool IsLeaf(Node n) => n.Op == '\0';

    public static double Evaluate(Node n)
    {
        if (IsLeaf(n)) return n.Value;
        double a = Evaluate(n.Left!), b = Evaluate(n.Right!); // both subtrees first, then this node
        return n.Op switch { '+' => a + b, '-' => a - b, '*' => a * b, '/' => a / b, _ => throw new InvalidOperationException() };
    }

    public static int Height(Node n) => IsLeaf(n) ? 0 : 1 + Math.Max(Height(n.Left!), Height(n.Right!));

    public static string ToInfix(Node n) =>
        IsLeaf(n) ? n.Value.ToString(CultureInfo.InvariantCulture) : $"({ToInfix(n.Left!)} {n.Op} {ToInfix(n.Right!)})";

    public static int CountLeaves(Node n) => IsLeaf(n) ? 1 : CountLeaves(n.Left!) + CountLeaves(n.Right!);
}
