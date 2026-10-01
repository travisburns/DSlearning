namespace Challenges.Relational;

public class ShopDb
{
    private record Customer(int Id, string Name, string City);
    private record Order(int Id, int CustomerId, decimal Total);

    private readonly Dictionary<int, Customer> _customers = new(); // primary key → row
    private readonly Dictionary<int, Order> _orders = new();
    private readonly Dictionary<int, int> _ordersPerCustomer = new();

    public void AddCustomer(int id, string name, string city)
    {
        if (!_customers.TryAdd(id, new Customer(id, name, city))) throw new InvalidOperationException($"Duplicate customer id {id}");
    }

    public void AddOrder(int id, int customerId, decimal total)
    {
        if (!_customers.ContainsKey(customerId)) throw new InvalidOperationException($"Order {id}: customer {customerId} does not exist (foreign key)");
        if (!_orders.TryAdd(id, new Order(id, customerId, total))) throw new InvalidOperationException($"Duplicate order id {id}");
        _ordersPerCustomer[customerId] = _ordersPerCustomer.GetValueOrDefault(customerId) + 1;
    }

    public bool DeleteCustomer(int id)
    {
        if (_ordersPerCustomer.GetValueOrDefault(id) > 0) return false; // ON DELETE RESTRICT
        return _customers.Remove(id);
    }

    public List<(string City, int Orders, decimal Revenue)> RevenueByCity()
    {
        var groups = new Dictionary<string, (int Orders, decimal Revenue)>();
        foreach (var o in _orders.Values)
        {
            var city = _customers[o.CustomerId].City; // the join: one O(1) lookup per order
            var g = groups.GetValueOrDefault(city);
            groups[city] = (g.Orders + 1, g.Revenue + o.Total);
        }
        return groups.Select(kv => (kv.Key, kv.Value.Orders, kv.Value.Revenue))
            .OrderByDescending(g => g.Revenue).ThenBy(g => g.Key, StringComparer.Ordinal).ToList();
    }
}
