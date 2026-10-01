using Challenges.Strings;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "string")]
public class StringTests
{
    [Fact]
    public void Escapes_only_when_needed()
    {
        Assert.Equal("plain", CsvExport.Escape("plain"));
        Assert.Equal("\"a,b\"", CsvExport.Escape("a,b"));
        Assert.Equal("\"say \"\"hi\"\"\"", CsvExport.Escape("say \"hi\""));
        Assert.Equal("\"two\nlines\"", CsvExport.Escape("two\nlines"));
    }

    [Fact]
    public void Builds_rows()
    {
        var csv = CsvExport.Build(new[] { new[] { "name", "city" }, new[] { "Ann", "Paris, FR" } });
        Assert.Equal("name,city\nAnn,\"Paris, FR\"", csv);
    }

    [Fact]
    public void Exports_100k_rows_quickly() =>
        Perf.Under(2000, () =>
        {
            var rows = Enumerable.Range(0, 100_000).Select(i => new[] { i.ToString(), "item " + i, "12.50" });
            var csv = CsvExport.Build(rows);
            Assert.True(csv.Length > 2_000_000);
        }, "100,000-row export");
}
