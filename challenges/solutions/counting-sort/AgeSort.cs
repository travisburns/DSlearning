namespace Challenges.CountingSort;

public record Person(string Name, int Age);

public static class AgeSort
{
    public const int MaxAge = 120;

    public static int[] SortAges(int[] ages)
    {
        var count = new int[MaxAge + 1];
        foreach (var a in ages) count[a]++;
        var outp = new int[ages.Length];
        var w = 0;
        for (var age = 0; age <= MaxAge; age++)
            for (var c = 0; c < count[age]; c++) outp[w++] = age;
        return outp;
    }

    public static Person[] SortPeople(Person[] people)
    {
        var count = new int[MaxAge + 2];
        foreach (var p in people) count[p.Age + 1]++;
        for (var age = 1; age < count.Length; age++) count[age] += count[age - 1]; // count[age] = where that age starts
        var outp = new Person[people.Length];
        foreach (var p in people) outp[count[p.Age]++] = p; // input order kept within an age: stable
        return outp;
    }
}
