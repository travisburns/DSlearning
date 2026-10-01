# Shop database with keys and reports

**The ticket.** Before we move to SQL Server, model the shop's data in memory with the same rules a relational database enforces, plus the monthly revenue report.

**Build** `ShopDb` in `ShopDb.cs`:

- `void AddCustomer(int id, string name, string city)`: `id` is the primary key; a duplicate throws `InvalidOperationException`.
- `void AddOrder(int id, int customerId, decimal total)`: `id` is the primary key; `customerId` is a **foreign key**: if that customer doesn't exist, throw `InvalidOperationException`.
- `bool DeleteCustomer(int id)`: refuse (return false) while the customer still has orders, like `ON DELETE RESTRICT`.
- `List<(string City, int Orders, decimal Revenue)> RevenueByCity()`: like `SELECT city, COUNT(*), SUM(total) FROM orders JOIN customers … GROUP BY city ORDER BY SUM(total) DESC, city`. Cities with no orders are left out.

**Hint.** One `Dictionary` per table, keyed by primary key, makes the key checks O(1). Track each customer's order count to make the RESTRICT check O(1) too.

**Run:** `dotnet test --filter Lesson=relational-model`
