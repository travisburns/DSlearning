using System.Text;
using Challenges.Ropes;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "rope")]
public class RopeTests
{
    [Fact]
    public void Edits()
    {
        var r = new Rope("Hello world");
        r.Insert(5, ",");
        r.Insert(r.Length, "!");
        Assert.Equal("Hello, world!", r.ToString());
        r.Delete(5, 7);
        Assert.Equal("Hello!", r.ToString());
        Assert.Equal('o', r.CharAt(4));
        r.Insert(0, ">> ");
        Assert.Equal(">> Hello!", r.ToString());
        Assert.Equal(9, r.Length);
        var empty = new Rope("");
        empty.Insert(0, "x");
        Assert.Equal("x", empty.ToString());
    }

    [Fact]
    public void Matches_a_StringBuilder_through_random_edits()
    {
        var rnd = new Random(127);
        var r = new Rope("start");
        var sb = new StringBuilder("start");
        for (var i = 0; i < 2000; i++)
        {
            if (rnd.Next(3) > 0 || sb.Length < 5)
            {
                var at = rnd.Next(sb.Length + 1);
                var s = new string((char)('a' + rnd.Next(26)), rnd.Next(1, 4));
                r.Insert(at, s);
                sb.Insert(at, s);
            }
            else
            {
                var at = rnd.Next(sb.Length - 2);
                var n = rnd.Next(1, 3);
                r.Delete(at, n);
                sb.Remove(at, n);
            }
            var k = rnd.Next(sb.Length);
            Assert.Equal(sb[k], r.CharAt(k));
        }
        Assert.Equal(sb.ToString(), r.ToString());
    }

    [Fact]
    public void Typing_in_the_middle_of_a_big_file()
    {
        var text = new string('x', 2_000_000);
        Perf.Under(2000, () =>
        {
            var r = new Rope(text);
            for (var i = 0; i < 50_000; i++)
            {
                r.Insert(1_000_000 + i, "y");
                r.CharAt(i * 17);
            }
            Assert.Equal(2_050_000, r.Length);
        }, "50,000 keystrokes in the middle of a 2,000,000-char file");
    }
}
