using Challenges.CountingSort;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "counting-sort")]
public class CountingSortTests
{
    [Fact]
    public void Sorts_ages()
    {
        Assert.Equal(new[] { 0, 3, 3, 40, 120 }, AgeSort.SortAges(new[] { 40, 3, 120, 0, 3 }));
    }

    [Fact]
    public void Keeps_original_order_within_an_age()
    {
        var people = new[] { new Person("Abe", 30), new Person("Bea", 20), new Person("Cal", 30), new Person("Dee", 20) };
        var sorted = AgeSort.SortPeople(people);
        Assert.Equal(new[] { "Bea", "Dee", "Abe", "Cal" }, sorted.Select(p => p.Name));
    }

    [Fact]
    public void Five_million_ages_sort_fast() =>
        Perf.Under(1600, () =>
        {
            var rnd = new Random(1);
            var ages = new int[5_000_000];
            for (var i = 0; i < ages.Length; i++) ages[i] = rnd.Next(121);
            var s = AgeSort.SortAges(ages);
            Assert.True(s[0] == 0 && s[^1] == 120);
        }, "sorting 5,000,000 ages");
}
