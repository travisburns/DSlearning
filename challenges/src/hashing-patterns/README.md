# Checkout helpers

**The ticket.** Three small features for the shop, all slow today because they compare every item with every other.

1. **Gift card:** find two different items whose prices add up to exactly the card value.
2. **Duplicate order:** the first order ID that appears a second time in today's stream.
3. **Top sellers:** the `k` most frequently ordered products.

**Build** in `Checkout.cs`:

- `(int, int)? TwoItemsFor(int[] prices, int card)`: indexes `i < j`. One pass: for each price, ask "have I already seen the partner I need?".
- `int? FirstRepeat(int[] orderIds)`: the first ID seen twice (in order of the second sighting).
- `List<string> TopSellers(string[] orders, int k)`: most frequent first; ties by name A→Z.

**Rules.** O(n) for the first two (O(n log n) is fine for TopSellers' final sort). Use `Dictionary`/`HashSet`.

**Run:** `dotnet test --filter Lesson=hashing-patterns`
