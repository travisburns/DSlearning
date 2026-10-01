namespace Challenges.KdTree;

public class StoreFinder
{
    private readonly (double X, double Y, string Name)[] _p; // laid out as an implicit tree: mid of each range is the node

    public StoreFinder(List<(double X, double Y, string Name)> stores)
    {
        _p = stores.ToArray();
        Build(0, _p.Length - 1, 0);
    }

    private static double Coord((double X, double Y, string) p, int axis) => axis == 0 ? p.X : p.Y;

    private void Build(int lo, int hi, int depth)
    {
        if (lo >= hi) return;
        var axis = depth % 2;
        var mid = (lo + hi) / 2;
        Array.Sort(_p, lo, hi - lo + 1, Comparer<(double X, double Y, string Name)>.Create((a, b) => Coord(a, axis).CompareTo(Coord(b, axis))));
        Build(lo, mid - 1, depth + 1);
        Build(mid + 1, hi, depth + 1);
    }

    public string Nearest(double x, double y)
    {
        var best = -1;
        var bestD = double.MaxValue;
        void Search(int lo, int hi, int depth)
        {
            if (lo > hi) return;
            var mid = (lo + hi) / 2;
            var p = _p[mid];
            var d = (p.X - x) * (p.X - x) + (p.Y - y) * (p.Y - y);
            if (d < bestD) (best, bestD) = (mid, d);
            var diff = (depth % 2 == 0 ? x : y) - Coord(p, depth % 2);
            var (nearLo, nearHi, farLo, farHi) = diff < 0 ? (lo, mid - 1, mid + 1, hi) : (mid + 1, hi, lo, mid - 1);
            Search(nearLo, nearHi, depth + 1);
            if (diff * diff < bestD) Search(farLo, farHi, depth + 1); // the other side could still hold something closer
        }
        Search(0, _p.Length - 1, 0);
        return _p[best].Name;
    }

    public List<string> Within(double x, double y, double radius)
    {
        var outp = new List<string>();
        void Search(int lo, int hi, int depth)
        {
            if (lo > hi) return;
            var mid = (lo + hi) / 2;
            var p = _p[mid];
            if ((p.X - x) * (p.X - x) + (p.Y - y) * (p.Y - y) <= radius * radius) outp.Add(p.Name);
            var diff = (depth % 2 == 0 ? x : y) - Coord(p, depth % 2);
            if (diff <= radius) Search(mid + 1, hi, depth + 1);
            if (diff >= -radius) Search(lo, mid - 1, depth + 1);
        }
        Search(0, _p.Length - 1, 0);
        outp.Sort(StringComparer.Ordinal);
        return outp;
    }
}
