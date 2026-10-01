namespace Challenges.Mvcc;

public class MvccStore
{
    private readonly Dictionary<string, List<(long Ts, string? Value)>> _versions = new(); // oldest first
    private long _clock;

    public Tx Begin() => new(this, _clock);

    public int VersionCount(string key) => _versions.TryGetValue(key, out var v) ? v.Count : 0;

    public class Tx(MvccStore store, long snapshot)
    {
        private readonly Dictionary<string, string?> _writes = new();

        public string? Read(string key)
        {
            if (_writes.TryGetValue(key, out var mine)) return mine; // read your own writes
            if (!store._versions.TryGetValue(key, out var vs)) return null;
            for (var i = vs.Count - 1; i >= 0; i--)
                if (vs[i].Ts <= snapshot) return vs[i].Value; // newest version visible to this snapshot
            return null;
        }

        public void Write(string key, string? value) => _writes[key] = value;

        public bool Commit()
        {
            lock (store)
            {
                foreach (var key in _writes.Keys)
                    if (store._versions.TryGetValue(key, out var vs) && vs[^1].Ts > snapshot) return false; // someone else committed first
                var ts = ++store._clock;
                foreach (var (k, v) in _writes)
                {
                    if (!store._versions.TryGetValue(k, out var vs)) store._versions[k] = vs = new();
                    vs.Add((ts, v)); // a new version; old ones stay for older snapshots
                }
                return true;
            }
        }
    }
}
