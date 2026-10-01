namespace Challenges.Transactions;

public class TxStore
{
    private readonly Dictionary<string, string> _committed = new();
    private readonly Stack<Dictionary<string, string?>> _tx = new(); // innermost transaction on top; null = deleted

    public int Depth => _tx.Count;

    public string? Get(string key)
    {
        foreach (var layer in _tx) // Stack enumerates from the top (newest) down
            if (layer.TryGetValue(key, out var v)) return v;
        return _committed.TryGetValue(key, out var c) ? c : null;
    }

    public void Set(string key, string value) => Write(key, value);

    public void Delete(string key) => Write(key, null);

    private void Write(string key, string? value)
    {
        if (_tx.Count > 0) _tx.Peek()[key] = value; // provisional until commit
        else if (value == null) _committed.Remove(key);
        else _committed[key] = value;
    }

    public void Begin() => _tx.Push(new Dictionary<string, string?>());

    public bool Rollback()
    {
        if (_tx.Count == 0) return false;
        _tx.Pop(); // throw the changes away
        return true;
    }

    public bool Commit()
    {
        if (_tx.Count == 0) return false;
        var changes = _tx.Pop();
        foreach (var (k, v) in changes) Write(k, v); // into the enclosing transaction, or the store
        return true;
    }
}
