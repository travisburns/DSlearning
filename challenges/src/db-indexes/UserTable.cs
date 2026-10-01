namespace Challenges.Indexes;

public record User(int Id, string Email, int Age);

public class UserTable
{
    public void Insert(User u) => throw new NotImplementedException("Your code here");

    public void Update(User u) => throw new NotImplementedException();

    public bool Delete(int id) => throw new NotImplementedException();

    public User? FindByEmail(string email) => throw new NotImplementedException();

    public List<User> FindByAge(int lo, int hi) => throw new NotImplementedException();
}
