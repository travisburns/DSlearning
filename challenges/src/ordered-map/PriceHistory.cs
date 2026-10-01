namespace Challenges.OrderedMaps;

public class PriceHistory
{
    public (long Time, decimal Price)? Latest => throw new NotImplementedException("Your code here");

    public void Record(long time, decimal price) => throw new NotImplementedException();

    public decimal? PriceAt(long time) => throw new NotImplementedException();

    public List<(long Time, decimal Price)> Between(long from, long to) => throw new NotImplementedException();
}
