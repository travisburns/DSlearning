namespace Challenges.VirtualMemory;

public class Mmu(int pageSize, int frames, string policy)
{
    private readonly Dictionary<int, int> _pageTable = new();  // page → frame
    private readonly LinkedList<int> _order = new();           // victim order: front = next to evict
    private readonly Dictionary<int, LinkedListNode<int>> _node = new();
    private readonly SortedSet<int> _free = new(Enumerable.Range(0, frames));
    private int _faults;

    public int Faults => _faults;

    public int? FrameOf(int page) => _pageTable.TryGetValue(page, out var f) ? f : null;

    public int Translate(int virtualAddress)
    {
        int page = virtualAddress / pageSize, offset = virtualAddress % pageSize;
        if (_pageTable.TryGetValue(page, out var frame))
        {
            if (policy == "LRU")
            {
                _order.Remove(_node[page]); // used now: move to the back (most recent)
                _order.AddLast(_node[page]);
            }
            return frame * pageSize + offset;
        }
        _faults++;
        if (_free.Count > 0)
        {
            frame = _free.Min;
            _free.Remove(frame);
        }
        else
        {
            var victim = _order.First!.Value; // FIFO: loaded first; LRU: used longest ago
            _order.RemoveFirst();
            _node.Remove(victim);
            frame = _pageTable[victim];
            _pageTable.Remove(victim);
        }
        _pageTable[page] = frame;
        _node[page] = _order.AddLast(page);
        return frame * pageSize + offset;
    }

    public static int CountFaults(int[] pages, int frames, string policy)
    {
        var m = new Mmu(1, frames, policy);
        foreach (var p in pages) m.Translate(p);
        return m.Faults;
    }
}
