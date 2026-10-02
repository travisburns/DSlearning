namespace Challenges.Http;

public class HttpRequest
{
    public string Method { get; init; } = "";
    public string Path { get; init; } = "";
    public Dictionary<string, string> Query { get; init; } = new();
    public Dictionary<string, string> Headers { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public string Body { get; init; } = "";

    public static HttpRequest Parse(string raw) => throw new NotImplementedException("Your code here");
}

public static class HttpResponse
{
    public static string Build(int status, string body, string contentType = "text/plain") => throw new NotImplementedException();
}

public class Router
{
    public void Map(string method, string pattern, Func<HttpRequest, IDictionary<string, string>, (int Status, string Body)> handler) =>
        throw new NotImplementedException();

    public string Handle(string raw) => throw new NotImplementedException();
}
