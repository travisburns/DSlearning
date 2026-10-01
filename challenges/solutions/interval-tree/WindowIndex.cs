namespace Challenges.IntervalTree;

public class WindowIndex
{
    private readonly (int Start, int End, string Name)[] _w; // sorted by start; the "tree" is implicit: mid of each range is its root
    private readonly int[] _maxEnd;                           // _maxEnd[mid] = largest End in that node's subtree

    public WindowIndex(List<(int Start, int End, string Name)> windows)
    {
        _w = windows.OrderBy(w => w.Start).ThenBy(w => w.Name, StringComparer.Ordinal).ToArray();
        _maxEnd = new int[_w.Length];
        Build(0, _w.Length - 1);
    }

    private int Build(int lo, int hi)
    {
        if (lo > hi) return int.MinValue;
        var mid = (lo + hi) / 2;
        _maxEnd[mid] = Math.Max(_w[mid].End, Math.Max(Build(lo, mid - 1), Build(mid + 1, hi)));
        return _maxEnd[mid];
    }

    public List<string> Overlapping(int from, int to)
    {
        var outp = new List<string>();
        Query(0, _w.Length - 1, from, to, outp);
        return outp;
    }

    private void Query(int lo, int hi, int from, int to, List<string> outp)
    {
        if (lo > hi) return;
        var mid = (lo + hi) / 2;
        if (_maxEnd[mid] < from) return;                      // everything here ends before the query: skip it all
        Query(lo, mid - 1, from, to, outp);                    // left side (earlier starts) first, to keep order
        if (_w[mid].Start > to) return;                        // this and everything to the right start too late
        if (_w[mid].End >= from) outp.Add(_w[mid].Name);
        Query(mid + 1, hi, from, to, outp);
    }
}
