# CSV export for the reports page

**The ticket.** Users export reports with up to 100,000 rows. The current code does `csv += line` in a loop and the export takes minutes. Rewrite it.

**Build** in `CsvExport.cs`:

- `string Escape(string field)`: if the field contains a comma, a double quote or a newline, wrap it in double quotes and double any quotes inside (`say "hi"` → `"say ""hi"""`). Otherwise return it unchanged.
- `string Build(IEnumerable<string[]> rows)`: each row is its escaped fields joined by commas; rows separated by `\n` (no trailing newline).

**Rules.** C# strings are immutable: `+=` copies the whole string every time (O(n²) overall). Use `StringBuilder`.

**Run:** `dotnet test --filter Lesson=string`
