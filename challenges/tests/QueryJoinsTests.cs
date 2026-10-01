using Challenges.QueryJoins;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "query-joins")]
public class QueryJoinsTests
{
    private record Customer(int Id, string Name);
    private record Order(int Id, int CustomerId);

    private static readonly Customer[] Cs = { new(1, "Ann"), new(2, "Bob"), new(3, "Cy") };
    private static readonly Order[] Os = { new(10, 2), new(11, 1), new(12, 2), new(13, 9) };

    [Fact]
    public void Inner_join()
    {
        var r = Joins.HashJoin(Cs, Os, c => c.Id, o => o.CustomerId);
        Assert.Equal(new[] { (10, "Bob"), (11, "Ann"), (12, "Bob") }, r.Select(p => (p.Right.Id, p.Left.Name)));
    }

    [Fact]
    public void Left_join_keeps_unmatched_rows()
    {
        var r = Joins.LeftJoin(Cs, Os, c => c.Id, o => o.CustomerId);
        Assert.Equal(new[] { ("Ann", (int?)11), ("Bob", 10), ("Bob", 12), ("Cy", null) }, r.Select(p => (p.Left.Name, p.Right?.Id)));
    }

    [Fact]
    public void Big_exports()
    {
        var customers = Enumerable.Range(0, 100_000).Select(i => new Customer(i, "c" + i)).ToList();
        var orders = Enumerable.Range(0, 200_000).Select(i => new Order(i, i % 120_000)).ToList();
        Perf.Under(1500, () =>
        {
            Assert.Equal(180_000, Joins.HashJoin(customers, orders, c => c.Id, o => o.CustomerId).Count); // orders for customers 100,000+ have no match
            Assert.True(Joins.LeftJoin(customers, orders, c => c.Id, o => o.CustomerId).Count >= 100_000);
        }, "joining 100,000 customers with 200,000 orders");
    }
}
