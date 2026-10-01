using System.Text;

namespace Challenges.Wal;

public class WalStore
{
    private readonly Stream _log;
    private readonly Dictionary<string, string> _data = new();

    public WalStore(Stream log)
    {
        _log = log;
        Recover();
        _log.Seek(0, SeekOrigin.End);
    }

    public int Count => _data.Count;

    public string? Get(string key) => _data.TryGetValue(key, out var v) ? v : null;

    public void Commit(IReadOnlyDictionary<string, string?> changes)
    {
        var sb = new StringBuilder();
        foreach (var (k, v) in changes) sb.Append(v == null ? $"DEL {k}\n" : $"SET {k}\t{v}\n");
        sb.Append("COMMIT\n");
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        _log.Write(bytes);
        _log.Flush(); // durable first…
        Apply(changes); // …then visible
    }

    private void Apply(IEnumerable<KeyValuePair<string, string?>> changes)
    {
        foreach (var (k, v) in changes)
            if (v == null) _data.Remove(k);
            else _data[k] = v;
    }

    private void Recover()
    {
        _log.Seek(0, SeekOrigin.Begin);
        var text = new StreamReader(_log, Encoding.UTF8, false, 4096, leaveOpen: true).ReadToEnd();
        var batch = new List<KeyValuePair<string, string?>>();
        var pos = 0;
        while (true)
        {
            var nl = text.IndexOf('\n', pos);
            if (nl < 0) break; // a torn last line: the crash happened mid-write; ignore it
            var line = text[pos..nl];
            pos = nl + 1;
            if (line == "COMMIT")
            {
                Apply(batch); // only complete batches are replayed
                batch.Clear();
            }
            else if (line.StartsWith("SET "))
            {
                var tab = line.IndexOf('\t');
                batch.Add(new(line[4..tab], line[(tab + 1)..]));
            }
            else if (line.StartsWith("DEL ")) batch.Add(new(line[4..], null));
        }
        // Anything left in `batch` never reached COMMIT: discarded.
    }
}
