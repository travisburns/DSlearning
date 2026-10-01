using System.Text;

namespace Challenges.Stacks;

public class Notes
{
    // An action remembers exactly what it added or removed, so it can be reversed on its own.
    private record Action(bool Added, string Chunk);

    private readonly StringBuilder _text = new();
    private readonly Stack<Action> _undo = new(); // newest action on top: undone first
    private readonly Stack<Action> _redo = new();

    public string Text => _text.ToString();

    public void Type(string text) => Do(new Action(true, text), clearRedo: true);

    public void DeleteLast(int count)
    {
        count = Math.Min(count, _text.Length);
        if (count == 0) return;
        Do(new Action(false, _text.ToString(_text.Length - count, count)), clearRedo: true);
    }

    public bool Undo()
    {
        if (_undo.Count == 0) return false;
        var a = _undo.Pop();
        Apply(a with { Added = !a.Added }); // reverse it
        _redo.Push(a);
        return true;
    }

    public bool Redo()
    {
        if (_redo.Count == 0) return false;
        Do(_redo.Pop(), clearRedo: false);
        return true;
    }

    private void Do(Action a, bool clearRedo)
    {
        Apply(a);
        _undo.Push(a);
        if (clearRedo) _redo.Clear();
    }

    private void Apply(Action a)
    {
        if (a.Added) _text.Append(a.Chunk);
        else _text.Length -= a.Chunk.Length;
    }
}
