# Page replacement simulator

**The ticket.** The platform team is tuning a cache that behaves exactly like virtual memory: a fixed number of frames, pages loaded on demand, one evicted when full. Build a small **MMU simulator** to compare policies.

**Build** in `Mmu.cs`:

- `Mmu(int pageSize, int frames, string policy)`: policy is `"FIFO"` or `"LRU"`.
- `int Translate(int virtualAddress)`: page = address / pageSize, offset = address % pageSize. If the page isn't loaded, that's a fault: use the lowest free frame, or evict a victim (FIFO: loaded longest ago; LRU: used longest ago) and reuse its frame. Return `frame * pageSize + offset`.
- `int Faults`, and `int? FrameOf(int page)` (null if not loaded).
- `static int CountFaults(int[] pages, int frames, string policy)`: faults for a sequence of page numbers.

**Run:** `dotnet test --filter Lesson=virtual-memory`
