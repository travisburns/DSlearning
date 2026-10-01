using Challenges.Pointers;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "pointers")]
public class PointersTests
{
    [Fact]
    public void Chain_follows_manager_references_to_the_top()
    {
        var ceo = new Employee("Ana");
        var vp = new Employee("Bo", ceo);
        var dev = new Employee("Cy", vp);
        Assert.Equal(new[] { "Cy", "Bo", "Ana" }, OrgChart.ChainOfCommand(dev));
    }

    [Fact]
    public void Renaming_a_manager_is_seen_by_everyone_pointing_at_them()
    {
        var ceo = new Employee("Ana");
        var dev = new Employee("Cy", ceo);
        ceo.Name = "Ana Smith";
        Assert.Equal("Ana Smith", OrgChart.ChainOfCommand(dev)[1]);
    }

    [Fact]
    public void Reassign_moves_the_whole_team_with_one_change()
    {
        var ceo = new Employee("Ana");
        var oldBoss = new Employee("Bo", ceo);
        var newBoss = new Employee("Di", ceo);
        var lead = new Employee("Cy", oldBoss);
        var dev = new Employee("Ed", lead);
        OrgChart.Reassign(lead, newBoss);
        Assert.Equal(new[] { "Ed", "Cy", "Di", "Ana" }, OrgChart.ChainOfCommand(dev));
    }

    [Fact]
    public void Same_person_means_same_object_not_same_name()
    {
        var a = new Employee("Sam");
        var b = new Employee("Sam");
        var c = a;
        Assert.False(OrgChart.SamePerson(a, b));
        Assert.True(OrgChart.SamePerson(a, c));
    }
}
