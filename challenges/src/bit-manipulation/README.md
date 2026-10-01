# Pack colours, and find the unmatched ticket

**The ticket.** Two small jobs from the graphics and ticketing teams.

1. A colour is red, green and blue values 0–255. Store it in one `int` as `0xRRGGBB`, and get the parts back out.
2. Every entry ticket scanned in must be scanned out again, so each ID appears exactly twice in the log, except one person still inside. Find them with no dictionary.

**Build** in `BitTools.cs`:

- `int Pack(int r, int g, int b)` and `(int R, int G, int B) Unpack(int rgb)`: use `<<`, `>>` and `& 0xFF`.
- `int Darken(int rgb)`: halve each channel (shift each part right by one) and repack.
- `int StillInside(int[] log)`: XOR everything; pairs cancel out (x ^ x = 0).

**Rules.** Bit operators only; no division, strings or collections.

**Run:** `dotnet test --filter Lesson=bit-manipulation`
