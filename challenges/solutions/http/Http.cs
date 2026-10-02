using System.Text;

namespace Challenges.Http;

public class HttpRequest
{
    public string Method { get; init; } = "";
    public string Path { get; init; } = "";
    public Dictionary<string, string> Query { get; init; } = new();
    public Dictionary<string, string> Headers { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public string Body { get; init; } = "";

    public static HttpRequest Parse(string raw)
    {
        var split = raw.IndexOf("\r\n\r\n", StringComparison.Ordinal);
        if (split < 0) throw new FormatException("No blank line after the headers");
        var lines = raw[..split].Split("\r\n");
        var start = lines[0].Split(' ');
        if (start.Length != 3 || start[0].Length == 0 || !start[1].StartsWith('/') || !start[2].StartsWith("HTTP/"))
            throw new FormatException($"Bad request line: {lines[0]}");

        var target = start[1];
        var q = target.IndexOf('?');
        var query = new Dictionary<string, string>();
        if (q >= 0)
        {
            foreach (var pair in target[(q + 1)..].Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var eq = pair.IndexOf('=');
                var k = eq < 0 ? pair : pair[..eq];
                var v = eq < 0 ? "" : pair[(eq + 1)..];
                query[Uri.UnescapeDataString(k)] = Uri.UnescapeDataString(v);
            }
            target = target[..q];
        }

        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines.Skip(1))
        {
            var colon = line.IndexOf(':');
            if (colon <= 0) throw new FormatException($"Bad header: {line}");
            headers[line[..colon].Trim()] = line[(colon + 1)..].Trim();
        }

        var rest = raw[(split + 4)..];
        var body = "";
        if (headers.TryGetValue("Content-Length", out var cl))
        {
            if (!int.TryParse(cl, out var n) || n < 0) throw new FormatException($"Bad Content-Length: {cl}");
            if (rest.Length < n) throw new FormatException("Body is shorter than Content-Length");
            body = rest[..n];
        }

        return new HttpRequest { Method = start[0], Path = target, Query = query, Headers = headers, Body = body };
    }
}

public static class HttpResponse
{
    private static readonly Dictionary<int, string> Reasons = new()
    {
        [200] = "OK", [201] = "Created", [400] = "Bad Request", [404] = "Not Found", [405] = "Method Not Allowed", [500] = "Internal Server Error",
    };

    public static string Build(int status, string body, string contentType = "text/plain") =>
        $"HTTP/1.1 {status} {Reasons.GetValueOrDefault(status, "Unknown")}\r\n" +
        $"Content-Type: {contentType}\r\n" +
        $"Content-Length: {Encoding.UTF8.GetByteCount(body)}\r\n" +
        "\r\n" + body;
}

public class Router
{
    private readonly List<(string Method, string[] Parts, Func<HttpRequest, IDictionary<string, string>, (int, string)> Handler)> _routes = new();

    public void Map(string method, string pattern, Func<HttpRequest, IDictionary<string, string>, (int Status, string Body)> handler) =>
        _routes.Add((method, pattern.Split('/', StringSplitOptions.RemoveEmptyEntries), handler));

    private static Dictionary<string, string>? Match(string[] parts, string[] path)
    {
        if (parts.Length != path.Length) return null;
        var values = new Dictionary<string, string>();
        for (var i = 0; i < parts.Length; i++)
        {
            if (parts[i].StartsWith('{') && parts[i].EndsWith('}')) values[parts[i][1..^1]] = Uri.UnescapeDataString(path[i]);
            else if (parts[i] != path[i]) return null;
        }
        return values;
    }

    public string Handle(string raw)
    {
        HttpRequest req;
        try
        {
            req = HttpRequest.Parse(raw);
        }
        catch (FormatException e)
        {
            return HttpResponse.Build(400, e.Message);
        }

        var path = req.Path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var pathMatched = false;
        foreach (var (method, parts, handler) in _routes)
        {
            var values = Match(parts, path);
            if (values == null) continue;
            pathMatched = true;
            if (method != req.Method) continue;
            try
            {
                var (status, body) = handler(req, values);
                return HttpResponse.Build(status, body);
            }
            catch (Exception)
            {
                return HttpResponse.Build(500, "Something went wrong");
            }
        }
        return pathMatched ? HttpResponse.Build(405, "Method not allowed") : HttpResponse.Build(404, "Not found");
    }
}
