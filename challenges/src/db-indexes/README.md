# A users table with indexes

**The ticket.** Login looks users up by email; the admin page lists users in an age range. Both are scans today. Add two indexes that stay correct through inserts, updates and deletes.

**Build** `UserTable` in `UserTable.cs` (`record User(int Id, string Email, int Age)` is given):

- `void Insert(User u)`: `Id` is the primary key and `Email` must be unique: violations throw `InvalidOperationException` and change nothing.
- `void Update(User u)`: replace the row with that Id (keep both indexes right; the new email must still be unique). `bool Delete(int id)`.
- `User? FindByEmail(string email)`: through a unique index (a `Dictionary`).
- `List<User> FindByAge(int lo, int hi)`: inclusive, ordered by age then id, through a sorted index (`SortedSet<(int Age, int Id)>` with `GetViewBetween`, the in-memory cousin of a B+ tree). Enumerate the view; don't call `.Count` on it (that's O(n)).

**Rules.** No scanning all rows in a lookup. 300,000 users and hundreds of thousands of lookups must be fast.

**Run:** `dotnet test --filter Lesson=db-indexes`
