# Ad slots and change-making

**The ticket.** Two features that look like they need trying every combination, but don't.

1. **Ad slots:** a page has a row of ad slots, each with an expected revenue. Two ads side by side annoy users, so no two adjacent slots can both be used. Maximise revenue.
2. **Change:** a vending machine has unusual coins (like 1, 3 and 4). Pay an amount with the fewest coins. Grabbing the biggest coin first is wrong: for 6 that gives 4+1+1, but 3+3 is better.

**Build** in `Planner.cs`:

- `long MaxAdRevenue(int[] slots)`: best[i] = max(best[i-1], best[i-2] + slots[i]).
- `int MinCoins(int amount, int[] coins)`: fewest coins, or -1 if impossible. best[a] = 1 + min over coins of best[a - coin].

**Rules.** Fill a table from small to large: O(n) and O(amount × coins). Trying all combinations is exponential and will time out.

**Run:** `dotnet test --filter Lesson=dp-1d`
