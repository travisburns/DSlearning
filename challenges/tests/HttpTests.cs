using Challenges.Http;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "http")]
public class HttpTests
{
    [Fact]
    public void Parses_a_get_with_query_and_headers()
    {
        var r = HttpRequest.Parse("GET /search?q=red%20shoes&page=2 HTTP/1.1\r\nHost: shop.example.com\r\nAccept:   application/json  \r\n\r\n");
        Assert.Equal("GET", r.Method);
        Assert.Equal("/search", r.Path);
        Assert.Equal("red shoes", r.Query["q"]);
        Assert.Equal("2", r.Query["page"]);
        Assert.Equal("shop.example.com", r.Headers["host"]);
        Assert.Equal("application/json", r.Headers["ACCEPT"]);
        Assert.Equal("", r.Body);
    }

    [Fact]
    public void Reads_exactly_content_length_of_body()
    {
        var r = HttpRequest.Parse("POST /orders HTTP/1.1\r\nContent-Length: 11\r\n\r\n{\"qty\": 3}\nEXTRA");
        Assert.Equal("POST", r.Method);
        Assert.Equal("{\"qty\": 3}\n", r.Body);
        Assert.Empty(r.Query);
    }

    [Theory]
    [InlineData("GET /x\r\n\r\n")]
    [InlineData("GET x HTTP/1.1\r\n\r\n")]
    [InlineData("GET /x HTTP/1.1\r\nNoColonHere\r\n\r\n")]
    [InlineData("POST /x HTTP/1.1\r\nContent-Length: 50\r\n\r\nshort")]
    [InlineData("GET /x HTTP/1.1\r\nHost: a")]
    public void Rejects_malformed_requests(string raw) => Assert.Throws<FormatException>(() => HttpRequest.Parse(raw));

    [Fact]
    public void Builds_a_response_with_byte_length()
    {
        Assert.Equal("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\n\r\nhi", HttpResponse.Build(200, "hi"));
        Assert.Equal("HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n{}", HttpResponse.Build(404, "{}", "application/json"));
        // "café" is 4 characters but 5 UTF-8 bytes.
        Assert.Contains("Content-Length: 5\r\n", HttpResponse.Build(201, "café"));
        Assert.StartsWith("HTTP/1.1 201 Created\r\n", HttpResponse.Build(201, "café"));
    }

    private static Router Shop()
    {
        var orders = new Dictionary<string, string> { ["42"] = "2 books" };
        var r = new Router();
        r.Map("GET", "/orders/{id}", (_, p) => orders.TryGetValue(p["id"], out var o) ? (200, o) : (404, "no such order"));
        r.Map("POST", "/orders", (req, _) =>
        {
            var id = (orders.Count + 100).ToString();
            orders[id] = req.Body;
            return (201, id);
        });
        r.Map("DELETE", "/orders/{id}", (_, p) => orders.Remove(p["id"]) ? (200, "deleted") : (404, "no such order"));
        r.Map("GET", "/crash", (_, _) => throw new InvalidOperationException("boom"));
        r.Map("GET", "/users/{user}/orders/{id}", (_, p) => (200, $"{p["user"]}:{p["id"]}"));
        return r;
    }

    private static int Status(string response) => int.Parse(response.Split(' ')[1]);

    private static string Body(string response) => response[(response.IndexOf("\r\n\r\n", StringComparison.Ordinal) + 4)..];

    [Fact]
    public void Routes_to_handlers_with_path_parameters()
    {
        var r = Shop();
        var res = r.Handle("GET /orders/42 HTTP/1.1\r\nHost: x\r\n\r\n");
        Assert.Equal(200, Status(res));
        Assert.Equal("2 books", Body(res));
        Assert.Equal("ann:7", Body(r.Handle("GET /users/ann/orders/7 HTTP/1.1\r\n\r\n")));
        Assert.Equal(404, Status(r.Handle("GET /orders/9 HTTP/1.1\r\n\r\n")));
    }

    [Fact]
    public void Post_then_get_round_trip()
    {
        var r = Shop();
        var created = r.Handle("POST /orders HTTP/1.1\r\nContent-Length: 5\r\n\r\n1 pen");
        Assert.Equal(201, Status(created));
        var id = Body(created);
        Assert.Equal("1 pen", Body(r.Handle($"GET /orders/{id} HTTP/1.1\r\n\r\n")));
        Assert.Equal(200, Status(r.Handle($"DELETE /orders/{id} HTTP/1.1\r\n\r\n")));
        Assert.Equal(404, Status(r.Handle($"GET /orders/{id} HTTP/1.1\r\n\r\n")));
    }

    [Fact]
    public void Error_statuses_are_correct()
    {
        var r = Shop();
        Assert.Equal(404, Status(r.Handle("GET /nothing/here HTTP/1.1\r\n\r\n")));
        Assert.Equal(404, Status(r.Handle("GET /orders/1/extra HTTP/1.1\r\n\r\n")));
        Assert.Equal(405, Status(r.Handle("PUT /orders/42 HTTP/1.1\r\n\r\n")));
        Assert.Equal(400, Status(r.Handle("this is not http\r\n\r\n")));
        Assert.Equal(500, Status(r.Handle("GET /crash HTTP/1.1\r\n\r\n")));
        Assert.Equal(200, Status(r.Handle("GET /orders/42 HTTP/1.1\r\n\r\n")));
    }
}
