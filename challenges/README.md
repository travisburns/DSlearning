# C# challenges

One small, real feature per lesson: the kind of ticket you'd get at work. Each one only works well (or fast enough) if you use the structure or algorithm from that lesson in the right place.

```
challenges/
  src/<lesson>/        README.md (the ticket) + starter code with empty methods  ← you work here
  tests/               xUnit tests: behaviour and speed. These are the judge.
  solutions/<lesson>/  reference answers. Look after your tests pass.
```

## Run

You need the [.NET 8 SDK](https://dotnet.microsoft.com/download).

```
cd challenges/tests
dotnet test --filter Lesson=lru-cache      # one challenge
dotnet test                                # everything
```

A failing speed test means the code gives the right answers but the approach doesn't scale: think about which structure makes that operation cheap.

## Checking the reference solutions

```
dotnet test -p:UseSolutions=true
```

compiles `solutions/` instead of `src/` and runs every test against it (they should all pass).
