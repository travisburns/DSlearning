using Challenges.Bits;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bits")]
public class BitsTests
{
    [Fact]
    public void Grant_and_revoke()
    {
        var p = Permissions.Grant(Perm.None, Perm.Read | Perm.Write);
        Assert.Equal(Perm.Read | Perm.Write, p);
        p = Permissions.Revoke(p, Perm.Write);
        Assert.Equal(Perm.Read, p);
        Assert.Equal(Perm.Read, Permissions.Revoke(p, Perm.Delete)); // revoking what you don't have changes nothing
    }

    [Fact]
    public void Toggle_flips()
    {
        var p = Permissions.Toggle(Perm.Read, Perm.Read | Perm.Share);
        Assert.Equal(Perm.Share, p);
    }

    [Fact]
    public void Has_requires_all_bits()
    {
        var p = Perm.Read | Perm.Write;
        Assert.True(Permissions.Has(p, Perm.Read));
        Assert.True(Permissions.Has(p, Perm.Read | Perm.Write));
        Assert.False(Permissions.Has(p, Perm.Read | Perm.Admin));
    }

    [Fact]
    public void Count_set_bits()
    {
        Assert.Equal(0, Permissions.Count(Perm.None));
        Assert.Equal(3, Permissions.Count(Perm.Read | Perm.Delete | Perm.Admin));
    }
}
