namespace Challenges.Indexes;

public record User(int Id, string Email, int Age);

public class UserTable
{
    private readonly Dictionary<int, User> _rows = new();                 // the table, by primary key
    private readonly Dictionary<string, int> _byEmail = new();            // unique index: email → id
    private readonly SortedSet<(int Age, int Id)> _byAge = new();         // sorted index: (age, id)

    public void Insert(User u)
    {
        if (_rows.ContainsKey(u.Id)) throw new InvalidOperationException($"Duplicate id {u.Id}");
        if (_byEmail.ContainsKey(u.Email)) throw new InvalidOperationException($"Duplicate email {u.Email}");
        _rows[u.Id] = u;
        _byEmail[u.Email] = u.Id;
        _byAge.Add((u.Age, u.Id));
    }

    public void Update(User u)
    {
        var old = _rows[u.Id];
        if (u.Email != old.Email && _byEmail.ContainsKey(u.Email)) throw new InvalidOperationException($"Duplicate email {u.Email}");
        _byEmail.Remove(old.Email); // every index must follow the row
        _byAge.Remove((old.Age, old.Id));
        _rows[u.Id] = u;
        _byEmail[u.Email] = u.Id;
        _byAge.Add((u.Age, u.Id));
    }

    public bool Delete(int id)
    {
        if (!_rows.Remove(id, out var old)) return false;
        _byEmail.Remove(old.Email);
        _byAge.Remove((old.Age, old.Id));
        return true;
    }

    public User? FindByEmail(string email) => _byEmail.TryGetValue(email, out var id) ? _rows[id] : null;

    public List<User> FindByAge(int lo, int hi)
    {
        var outp = new List<User>();
        if (lo > hi) return outp;
        foreach (var (_, id) in _byAge.GetViewBetween((lo, int.MinValue), (hi, int.MaxValue))) outp.Add(_rows[id]);
        return outp;
    }
}
