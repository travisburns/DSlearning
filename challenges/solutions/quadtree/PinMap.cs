namespace Challenges.Quadtree;

public class PinMap(double size, int leafCapacity = 8)
{
    private class Quad(double x, double y, double size)
    {
        public readonly double X = x, Y = y, Size = size;
        public List<(double X, double Y, int Id)>? Pins = new();
        public Quad[]? Kids;
    }

    private readonly Quad _root = new(0, 0, size);
    private int _count;

    public int Count => _count;

    public void Add(double x, double y, int id)
    {
        Insert(_root, (x, y, id));
        _count++;
    }

    private void Insert(Quad q, (double X, double Y, int Id) p)
    {
        while (q.Kids != null) q = q.Kids[Which(q, p.X, p.Y)];
        q.Pins!.Add(p);
        if (q.Pins.Count <= leafCapacity || q.Size < 1e-6) return;
        var h = q.Size / 2; // too crowded: split into four quarters and push the pins down
        q.Kids = [new(q.X, q.Y, h), new(q.X + h, q.Y, h), new(q.X, q.Y + h, h), new(q.X + h, q.Y + h, h)];
        var pins = q.Pins;
        q.Pins = null;
        foreach (var pin in pins) Insert(q, pin);
    }

    private static int Which(Quad q, double x, double y) => (x >= q.X + q.Size / 2 ? 1 : 0) + (y >= q.Y + q.Size / 2 ? 2 : 0);

    public List<int> InView(double x0, double y0, double x1, double y1)
    {
        var outp = new List<int>();
        var stack = new Stack<Quad>();
        stack.Push(_root);
        while (stack.Count > 0)
        {
            var q = stack.Pop();
            if (q.X > x1 || q.Y > y1 || q.X + q.Size < x0 || q.Y + q.Size < y0) continue; // no overlap: skip the whole square
            if (q.Kids != null)
                foreach (var k in q.Kids) stack.Push(k);
            else
                foreach (var p in q.Pins!)
                    if (p.X >= x0 && p.X <= x1 && p.Y >= y0 && p.Y <= y1) outp.Add(p.Id);
        }
        outp.Sort();
        return outp;
    }
}
