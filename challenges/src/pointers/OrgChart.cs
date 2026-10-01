namespace Challenges.Pointers;

public class Employee(string name, Employee? manager = null)
{
    public string Name { get; set; } = name;
    public Employee? Manager { get; set; } = manager;
}

public static class OrgChart
{
    public static List<string> ChainOfCommand(Employee e) => throw new NotImplementedException("Your code here");

    public static void Reassign(Employee e, Employee newManager) => throw new NotImplementedException();

    public static bool SamePerson(Employee a, Employee b) => throw new NotImplementedException();
}
