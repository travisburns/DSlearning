namespace Challenges.Balancing;

public class LoadBalancer
{
    private readonly IReadOnlyList<string> _servers;
    private readonly Dictionary<string, int> _index = new();
    private readonly int[] _load;
    private readonly int[] _failures;
    private readonly bool[] _up;
    private readonly SortedSet<(int Load, int Index)> _byLoad = new(); // up servers only
    private readonly int _threshold;
    private int _next;

    public LoadBalancer(IReadOnlyList<string> servers, int failuresToMarkDown)
    {
        _servers = servers;
        _threshold = failuresToMarkDown;
        _load = new int[servers.Count];
        _failures = new int[servers.Count];
        _up = new bool[servers.Count];
        for (var i = 0; i < servers.Count; i++)
        {
            _index[servers[i]] = i;
            _up[i] = true;
            _byLoad.Add((0, i));
        }
    }

    public string? NextRoundRobin()
    {
        for (var tried = 0; tried < _servers.Count; tried++)
        {
            var i = _next;
            _next = (_next + 1) % _servers.Count;
            if (_up[i]) return _servers[i];
        }
        return null;
    }

    private void SetLoad(int i, int load)
    {
        if (_up[i]) _byLoad.Remove((_load[i], i));
        _load[i] = load;
        if (_up[i]) _byLoad.Add((_load[i], i));
    }

    public string? Acquire()
    {
        if (_byLoad.Count == 0) return null;
        var (_, i) = _byLoad.Min;
        SetLoad(i, _load[i] + 1);
        return _servers[i];
    }

    public void Release(string server)
    {
        var i = _index[server];
        if (_load[i] > 0) SetLoad(i, _load[i] - 1);
    }

    public int InProgress(string server) => _load[_index[server]];

    public void ReportHealth(string server, bool ok)
    {
        var i = _index[server];
        if (ok)
        {
            _failures[i] = 0;
            if (!_up[i])
            {
                _up[i] = true;
                _byLoad.Add((_load[i], i));
            }
        }
        else if (++_failures[i] >= _threshold && _up[i])
        {
            _up[i] = false;
            _byLoad.Remove((_load[i], i));
        }
    }

    public bool IsUp(string server) => _up[_index[server]];
}
