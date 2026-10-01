# Build your own List<T>

**The ticket.** We're porting code to a tiny embedded runtime that has arrays but no `List<T>`. Write the growable list ourselves.

**Build** `GrowableList<T>` in `GrowableList.cs`, backed by a plain `T[]`:

- Starts with capacity 4. `Count` and `Capacity` properties.
- `Add(T item)`: when the array is full, allocate one **twice as big**, copy everything across, then add.
- Indexer `this[int i]` get/set; throw `ArgumentOutOfRangeException` outside 0..Count-1.
- `RemoveAt(int i)`: shift the later items left by one.

**Rules.** Don't use `List<T>` or `Array.Resize`. Add must be O(1) on average: a million adds should take milliseconds.

**Run:** `dotnet test --filter Lesson=dynamic-array`
