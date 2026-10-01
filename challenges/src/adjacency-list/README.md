# Course prerequisites

**The ticket.** The university catalogue has tens of thousands of courses and a list of "A is required before B" pairs. Most courses connect to only a few others, so a matrix would be almost all zeros. Use an **adjacency list**.

**Build** `Catalogue` in `Catalogue.cs`:

- `Catalogue(IEnumerable<(string Before, string After)> prereqs)`: build two lists per course: what it unlocks (outgoing) and what it requires (incoming).
- `List<string> Unlocks(string course)` and `List<string> Requires(string course)`: in the order the pairs were given.
- `int CourseCount`, `int LinkCount`.
- `List<string> EntryCourses()`: courses that require nothing, sorted A→Z.

**Rules.** Building and every query must be proportional to the number of links involved, not to the total number of courses squared.

**Run:** `dotnet test --filter Lesson=adjacency-list`
