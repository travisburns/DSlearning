using System.Text;

namespace Challenges.Strings;

public static class CsvExport
{
    public static string Escape(string field)
    {
        if (field.IndexOfAny([',', '"', '\n']) < 0) return field;
        return "\"" + field.Replace("\"", "\"\"") + "\"";
    }

    public static string Build(IEnumerable<string[]> rows)
    {
        var sb = new StringBuilder(); // a growable char buffer: appends don't copy what's already there
        var first = true;
        foreach (var row in rows)
        {
            if (!first) sb.Append('\n');
            first = false;
            for (var i = 0; i < row.Length; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(Escape(row[i]));
            }
        }
        return sb.ToString();
    }
}
