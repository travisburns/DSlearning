using Challenges.DoublyLinkedList;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "doubly-linked-list")]
public class DoublyLinkedListTests
{
    [Fact]
    public void Typing_moving_and_deleting()
    {
        var e = new EditorLine();
        foreach (var c in "helo") e.Type(c);
        e.Left();
        e.Type('l');
        Assert.Equal("hello", e.Text());
        Assert.Equal(4, e.CursorPosition);
        e.Right();
        e.Right(); // already at the end: stays
        e.Backspace();
        Assert.Equal("hell", e.Text());
        for (var i = 0; i < 10; i++) e.Left(); // stops at the start
        Assert.Equal(0, e.CursorPosition);
        e.Backspace(); // nothing before the cursor
        e.Type('>');
        Assert.Equal(">hell", e.Text());
    }

    [Fact]
    public void Typing_in_the_middle_of_a_huge_line_is_fast() =>
        Perf.Under(400, () =>
        {
            var e = new EditorLine();
            for (var i = 0; i < 100_000; i++) e.Type('a');
            for (var i = 0; i < 50_000; i++) e.Left();
            for (var i = 0; i < 200_000; i++)
            {
                e.Type('b');
                if (i % 2 == 0) e.Backspace();
            }
            Assert.Equal(200_000, e.Text().Length);
        }, "200,000 keystrokes in the middle of a 100,000-char line");
}
