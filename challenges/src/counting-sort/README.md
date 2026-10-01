# Sort 5 million survey answers by age

**The ticket.** A census export has millions of people, each with an age from 0 to 120. Reports need them sorted by age, and people with the same age must stay in their original order (the export is already sorted by surname within each age).

**Build** in `AgeSort.cs`:

- `int[] SortAges(int[] ages)`: count how many of each age, then write them out. No comparisons.
- `Person[] SortPeople(Person[] people)`: stable: count, turn counts into starting positions (prefix sums), then place each person in input order.

**Rules.** O(n + 121). No `Sort`/`OrderBy`. Five million ages must sort in well under a second.

**Run:** `dotnet test --filter Lesson=counting-sort`
