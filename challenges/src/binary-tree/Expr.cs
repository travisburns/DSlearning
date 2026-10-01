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
    public static double Evaluate(Node n) => throw new NotImplementedException("Your code here");

    public static int Height(Node n) => throw new NotImplementedException();

    public static string ToInfix(Node n) => throw new NotImplementedException();

    public static int CountLeaves(Node n) => throw new NotImplementedException();
}
