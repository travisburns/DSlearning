namespace Challenges.AdjacencyList;

public class Catalogue
{
    private readonly Dictionary<string, List<string>> _out = new(); // course → what it unlocks
    private readonly Dictionary<string, List<string>> _in = new();  // course → what it requires
    private int _links;

    public Catalogue(IEnumerable<(string Before, string After)> prereqs)
    {
        foreach (var (before, after) in prereqs)
        {
            List(_out, before).Add(after);
            List(_in, after).Add(before);
            List(_out, after);
            List(_in, before);
            _links++;
        }
    }

    private static List<string> List(Dictionary<string, List<string>> d, string k) => d.TryGetValue(k, out var l) ? l : d[k] = new List<string>();

    public int CourseCount => _out.Count;

    public int LinkCount => _links;

    public List<string> Unlocks(string course) => _out.TryGetValue(course, out var l) ? new(l) : new();

    public List<string> Requires(string course) => _in.TryGetValue(course, out var l) ? new(l) : new();

    public List<string> EntryCourses() => _in.Where(kv => kv.Value.Count == 0).Select(kv => kv.Key).OrderBy(x => x, StringComparer.Ordinal).ToList();
}
