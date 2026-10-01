# User permissions as bit flags

**The ticket.** Each user has a set of permissions. Storing a list of strings per user is wasteful and slow to check on every request. Pack them into one `int`: one bit per permission.

**Build** in `Permissions.cs` using only bit operators (`&`, `|`, `^`, `~`, `<<`, `>>`):

- `[Flags] enum Perm { None = 0, Read = 1, Write = 2, Delete = 4, Share = 8, Admin = 16 }` (given).
- `Grant(Perm p, Perm add)`, `Revoke(Perm p, Perm remove)`, `Toggle(Perm p, Perm flip)`: return the new value.
- `bool Has(Perm p, Perm required)`: true only if **all** required bits are set.
- `int Count(Perm p)`: how many permissions are set.

**Rules.** No loops over strings or lists; each operation is a couple of bit operations (Count may loop over the bits).

**Run:** `dotnet test --filter Lesson=bits`
