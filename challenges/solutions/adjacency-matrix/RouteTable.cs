namespace Challenges.AdjacencyMatrix;

public class RouteTable
{
    private readonly string[] _codes;
    private readonly Dictionary<string, int> _index;
    private readonly int[,] _price; // [from, to]; 0 = no flight

    public RouteTable(string[] airports)
    {
        _codes = airports;
        _index = airports.Select((c, i) => (c, i)).ToDictionary(x => x.c, x => x.i);
        _price = new int[airports.Length, airports.Length];
    }

    public void AddFlight(string from, string to, int price) => _price[_index[from], _index[to]] = price;

    public bool HasDirect(string from, string to) => Price(from, to) > 0;

    public int Price(string from, string to) => _price[_index[from], _index[to]]; // one cell: O(1)

    public List<string> Destinations(string from)
    {
        var i = _index[from];
        var outp = new List<string>();
        for (var j = 0; j < _codes.Length; j++) if (_price[i, j] > 0) outp.Add(_codes[j]); // scan the row
        return outp;
    }

    public int CheapestWithOneStop(string from, string to)
    {
        int a = _index[from], b = _index[to], best = -1;
        for (var k = 0; k < _codes.Length; k++)
            if (k != a && k != b && _price[a, k] > 0 && _price[k, b] > 0)
            {
                var cost = _price[a, k] + _price[k, b];
                if (best < 0 || cost < best) best = cost;
            }
        return best;
    }
}
