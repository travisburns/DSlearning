# Cheapest fibre network

**The ticket.** Connect every building on a campus with fibre. The surveyors list every possible cable run and its cost. Choose runs so every building is connected (directly or through others) at the lowest total cost.

**Build** in `Cabling.cs` (buildings are 0..n-1; options are `(A, B, Cost)`):

- `(long Total, List<(int A, int B, int Cost)> Chosen)? Plan(int n, List<(int A, int B, int Cost)> options)`: the cheapest set of runs connecting all buildings, or null if impossible.

**Hint.** Kruskal: sort runs by cost, then take each one unless its two buildings are already connected. "Already connected?" is exactly what union-find answers in practically O(1).

**Rules.** O(E log E). 100,000 buildings and 500,000 options must be fast. Exactly n − 1 runs are chosen.

**Run:** `dotnet test --filter Lesson=kruskal`
