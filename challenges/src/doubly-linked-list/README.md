# Text editor cursor

**The ticket.** Our editor stores a line as one big string, so typing in the middle of a long line copies everything after the cursor on every keystroke. Store characters in a **doubly linked list** with a cursor instead, so every keystroke is O(1).

**Build** `EditorLine` in `EditorLine.cs` (write your own `Node` with `Prev` and `Next`; a sentinel node at the start makes it easier):

- `void Type(char c)`: insert at the cursor; the cursor ends up after it.
- `void Backspace()`: delete the character before the cursor (nothing if at the start).
- `void Left()` / `void Right()`: move the cursor one character (stop at the ends).
- `string Text()`: the whole line. `int CursorPosition`.

**Rules.** Type, Backspace, Left and Right must be O(1). Don't use `LinkedList<T>`.

**Run:** `dotnet test --filter Lesson=doubly-linked-list`
