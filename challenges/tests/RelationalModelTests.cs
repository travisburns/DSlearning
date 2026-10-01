using Challenges.Relational;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "relational-model")]
public class RelationalModelTests
{
    [Fact]
    public void Keys_are_enforced()
    {
        var db = new ShopDb();
        db.AddCustomer(1, "Ann", "Leeds");
        Assert.Throws<InvalidOperationException>(() => db.AddCustomer(1, "Bob", "York"));
        db.AddOrder(10, 1, 20m);
        Assert.Throws<InvalidOperationException>(() => db.AddOrder(10, 1, 5m));
        Assert.Throws<InvalidOperationException>(() => db.AddOrder(11, 99, 5m));
        Assert.False(db.DeleteCustomer(1));
        db.AddCustomer(2, "Cy", "Hull");
        Assert.True(db.DeleteCustomer(2));
        Assert.False(db.DeleteCustomer(2));
    }

    [Fact]
    public void Revenue_report()
    {
        var db = new ShopDb();
        db.AddCustomer(1, "Ann", "Leeds");
        db.AddCustomer(2, "Bob", "York");
        db.AddCustomer(3, "Cy", "Leeds");
        db.AddCustomer(4, "Dee", "Hull");
        db.AddOrder(1, 1, 10m);
        db.AddOrder(2, 2, 50m);
        db.AddOrder(3, 3, 25m);
        db.AddOrder(4, 1, 15m);
        Assert.Equal(new[] { ("Leeds", 3, 50m), ("York", 1, 50m) }, db.RevenueByCity()); // tie on revenue: city A→Z; Hull has no orders
    }

    [Fact]
    public void Big_report_is_fast() =>
        Perf.Under(1500, () =>
        {
            var db = new ShopDb();
            for (var c = 0; c < 50_000; c++) db.AddCustomer(c, "c" + c, "city" + c % 100);
            for (var o = 0; o < 500_000; o++) db.AddOrder(o, o % 50_000, 1m);
            var r = db.RevenueByCity();
            Assert.Equal(100, r.Count);
            Assert.Equal(500_000m, r.Sum(x => x.Revenue));
        }, "50,000 customers, 500,000 orders and a report");
}
