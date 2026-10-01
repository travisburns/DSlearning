namespace Challenges.Sparse;

public class SparseMatrix(int rows, int cols)
{
    private readonly Dictionary<int, Dictionary<int, double>> _rows = new(); // only rows that have non-zeros
    private int _nnz;

    public int Rows => rows;

    public int Cols => cols;

    public int NonZeros => _nnz;

    public void Set(int r, int c, double v)
    {
        if (v == 0)
        {
            if (_rows.TryGetValue(r, out var row) && row.Remove(c))
            {
                _nnz--;
                if (row.Count == 0) _rows.Remove(r);
            }
            return;
        }
        if (!_rows.TryGetValue(r, out var rr)) _rows[r] = rr = new Dictionary<int, double>();
        if (!rr.ContainsKey(c)) _nnz++;
        rr[c] = v;
    }

    public double Get(int r, int c) => _rows.TryGetValue(r, out var row) && row.TryGetValue(c, out var v) ? v : 0; // missing = 0

    public double[] Multiply(double[] x)
    {
        var y = new double[rows];
        foreach (var (r, row) in _rows)
            foreach (var (c, v) in row) y[r] += v * x[c]; // zeros contribute nothing, so skip them entirely
        return y;
    }

    public SparseMatrix Transpose()
    {
        var t = new SparseMatrix(cols, rows);
        foreach (var (r, row) in _rows)
            foreach (var (c, v) in row) t.Set(c, r, v);
        return t;
    }

    public IEnumerable<(int Col, double Value)> Row(int r) =>
        _rows.TryGetValue(r, out var row) ? row.OrderBy(kv => kv.Key).Select(kv => (kv.Key, kv.Value)) : Enumerable.Empty<(int, double)>();
}
