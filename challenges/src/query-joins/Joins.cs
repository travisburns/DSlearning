namespace Challenges.QueryJoins;

public static class Joins
{
    public static List<(TL Left, TR Right)> HashJoin<TL, TR, TKey>(IEnumerable<TL> left, IEnumerable<TR> right, Func<TL, TKey> leftKey, Func<TR, TKey> rightKey)
        where TKey : notnull => throw new NotImplementedException("Your code here");

    public static List<(TL Left, TR? Right)> LeftJoin<TL, TR, TKey>(IEnumerable<TL> left, IEnumerable<TR> right, Func<TL, TKey> leftKey, Func<TR, TKey> rightKey)
        where TKey : notnull => throw new NotImplementedException();
}
