# Undo and redo for a notes app

**The ticket.** Users want Ctrl+Z and Ctrl+Y. Typing adds text; deleting removes characters from the end. Undo reverses the latest action, redo re-applies what was undone, and doing something new after an undo clears the redo history (like every editor).

**Build** `Notes` in `Notes.cs`:

- `void Type(string text)` and `void DeleteLast(int count)` (deletes at most what's there).
- `bool Undo()` / `bool Redo()`: false if there's nothing to undo/redo.
- `string Text`.

**Hint.** Think about which action needs to come back first. C# has `Stack<T>`; use it.

**Rules.** Undo and redo must be O(size of that one action), not a replay of the whole history.

**Run:** `dotnet test --filter Lesson=stack`
