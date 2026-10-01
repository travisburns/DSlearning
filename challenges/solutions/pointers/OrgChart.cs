namespace Challenges.Pointers;

public class Employee(string name, Employee? manager = null)
{
    public string Name { get; set; } = name;
    public Employee? Manager { get; set; } = manager;
}

public static class OrgChart
{
    public static List<string> ChainOfCommand(Employee e)
    {
        var names = new List<string>();
        for (Employee? cur = e; cur != null; cur = cur.Manager) names.Add(cur.Name); // follow the pointer up
        return names;
    }

    public static void Reassign(Employee e, Employee newManager) => e.Manager = newManager; // one reference changes

    public static bool SamePerson(Employee a, Employee b) => ReferenceEquals(a, b); // same address, not same contents
}
