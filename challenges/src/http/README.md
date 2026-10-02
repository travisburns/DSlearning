# A tiny HTTP server core

**The ticket.** We're building a minimal admin endpoint into a device that can't run ASP.NET. Bytes come in from a socket as text; we need to parse the request, route it to a handler and write a correct response. (This is exactly what Kestrel does for you, which is why it's worth building once.)

**Build** in `Http.cs`:

`HttpRequest.Parse(string raw)` returns an `HttpRequest` with:
- `Method`, `Path` (without the query string) and `Query` (a dictionary; `?a=1&b=2`, values URL-decoded with `Uri.UnescapeDataString`).
- `Headers`: case-insensitive names, values trimmed.
- `Body`: exactly `Content-Length` characters after the blank line (empty if there's no Content-Length).
- Lines end in `\r\n`. Throw `FormatException` if the request line isn't `METHOD /path HTTP/1.1` (three parts, path starting with `/`), a header has no `:`, or the body is shorter than `Content-Length`.

`HttpResponse.Build(int status, string body, string contentType = "text/plain")` returns the response text: `HTTP/1.1 200 OK`, then `Content-Type` and `Content-Length` (the body's UTF-8 byte count) headers, a blank line, then the body. Reason phrases: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 405 Method Not Allowed, 500 Internal Server Error.

`Router`:
- `void Map(string method, string pattern, Func<HttpRequest, IDictionary<string, string>, (int Status, string Body)> handler)`: patterns like `/orders/{id}`; `{name}` matches one path segment, passed to the handler.
- `string Handle(string raw)`: parse, route and build the response. Unparseable request → 400. No pattern matches the path → 404. A pattern matches the path but not with this method → 405. A handler that throws → 500 (the server keeps running).

**Hint.** Split on `"\r\n\r\n"` once to separate head and body. For routing, split pattern and path on `/` and compare segment by segment.

**Run:** `dotnet test --filter Lesson=http`
