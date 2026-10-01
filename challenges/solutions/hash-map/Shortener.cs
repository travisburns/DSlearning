using System.Text;

namespace Challenges.HashMaps;

public class Shortener
{
    public const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    private readonly Dictionary<string, string> _byUrl = new();  // url → code (so repeats get the same code)
    private readonly Dictionary<string, string> _byCode = new(); // code → url
    private long _next = 1;

    public int Count => _byUrl.Count;

    public string Shorten(string url)
    {
        if (_byUrl.TryGetValue(url, out var code)) return code;
        code = Base62(_next++);
        _byUrl[url] = code;
        _byCode[code] = url;
        return code;
    }

    public string? Resolve(string code) => _byCode.TryGetValue(code, out var url) ? url : null;

    private static string Base62(long n)
    {
        var sb = new StringBuilder();
        while (n > 0)
        {
            sb.Insert(0, Alphabet[(int)(n % 62)]);
            n /= 62;
        }
        return sb.ToString();
    }
}
