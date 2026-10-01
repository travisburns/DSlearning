namespace Challenges.EdgeList;

public record Road(string A, string B, int Km);

public static class Roads
{
    public static List<Road> Parse(string csv) => throw new NotImplementedException("Your code here");

    public static long TotalKm(List<Road> roads) => throw new NotImplementedException();

    public static List<Road> Longest(List<Road> roads, int n) => throw new NotImplementedException();

    public static Dictionary<string, List<(string To, int Km)>> ToAdjacency(List<Road> roads) => throw new NotImplementedException();
}
