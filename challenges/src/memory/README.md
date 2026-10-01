# Arena allocator for a game's per-frame data

**The ticket.** Our game creates thousands of tiny objects every frame and the garbage collector causes stutter. We want an *arena*: one big block of memory reserved up front, handed out in pieces, and wiped all at once at the end of each frame.

**Build** `MemoryArena` in `Arena.cs`:

- `MemoryArena(int size)`: reserve `size` bytes (one `byte[]`).
- `int Allocate(int bytes)`: hand out the next `bytes` bytes and return the **address** (offset) where they start. Pieces sit side by side with no gaps. Throw `OutOfMemoryException` if there isn't room.
- `void Write(int address, byte value)` / `byte Read(int address)`: access one byte by address.
- `int Used` and `void Reset()`: how many bytes are handed out; `Reset` makes the whole arena free again in O(1) (don't clear the bytes).

**Rules.** Allocate, Read, Write and Reset must all be O(1).

**Run:** `dotnet test --filter Lesson=memory`
