namespace Challenges.UnionFind;

public class Networks
{
    private readonly int[] _parent, _size;
    private int _groups;

    public Networks(int n)
    {
        _parent = new int[n];
        _size = new int[n];
        for (var i = 0; i < n; i++)
        {
            _parent[i] = i;
            _size[i] = 1;
        }
        _groups = n;
    }

    public int GroupCount => _groups;

    public int Find(int a)
    {
        var root = a;
        while (_parent[root] != root) root = _parent[root];
        while (_parent[a] != root) (a, _parent[a]) = (_parent[a], root); // path compression
        return root;
    }

    public void Connect(int a, int b)
    {
        int ra = Find(a), rb = Find(b);
        if (ra == rb) return;
        if (_size[ra] < _size[rb]) (ra, rb) = (rb, ra);
        _parent[rb] = ra; // smaller group joins the bigger one: trees stay shallow
        _size[ra] += _size[rb];
        _groups--;
    }

    public bool CanReach(int a, int b) => Find(a) == Find(b);

    public int GroupSize(int a) => _size[Find(a)];
}
