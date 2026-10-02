# Office network routing table

**The ticket.** The edge router in our office needs a routing table: given a list of networks (like `10.4.0.0/16 → vpn`) decide where each packet goes. Rules can overlap, and the most specific one must win. It also has to be fast: the real table has tens of thousands of routes and it handles hundreds of thousands of packets.

**Build** `RoutingTable` in `RoutingTable.cs`:

- `static uint Parse(string ip)`: `"192.168.1.20"` → the 32-bit number. Throw `FormatException` unless it is exactly four parts, each a number 0–255.
- `static string Format(uint ip)`: the reverse.
- `static bool Contains(string cidr, string ip)`: is `ip` inside a network like `"192.168.1.0/24"`?
- `void Add(string cidr, string nextHop)`: add a route. Throw `FormatException` for a bad address or a prefix outside 0–32. Bits after the prefix are ignored (`10.4.9.9/16` is the same network as `10.4.0.0/16`). Adding the same network again replaces its next hop.
- `string? Route(string ip)`: the next hop of the longest matching prefix, or null if nothing matches.

**Hint.** A mask for `/n` is the top `n` bits set: `n == 0 ? 0 : uint.MaxValue << (32 - n)`. For speed, keep one `Dictionary<uint, string>` per prefix length and try the longest lengths first (or build a binary trie on the bits).

**Run:** `dotnet test --filter Lesson=packets-ip`
