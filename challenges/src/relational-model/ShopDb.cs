namespace Challenges.Relational;

public class ShopDb
{
    public void AddCustomer(int id, string name, string city) => throw new NotImplementedException("Your code here");

    public void AddOrder(int id, int customerId, decimal total) => throw new NotImplementedException();

    public bool DeleteCustomer(int id) => throw new NotImplementedException();

    public List<(string City, int Orders, decimal Revenue)> RevenueByCity() => throw new NotImplementedException();
}
