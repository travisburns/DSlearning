namespace Challenges.Bits;

[Flags]
public enum Perm { None = 0, Read = 1, Write = 2, Delete = 4, Share = 8, Admin = 16 }

public static class Permissions
{
    public static Perm Grant(Perm p, Perm add) => p | add;          // switch bits on

    public static Perm Revoke(Perm p, Perm remove) => p & ~remove;  // keep everything except these bits

    public static Perm Toggle(Perm p, Perm flip) => p ^ flip;       // flip these bits

    public static bool Has(Perm p, Perm required) => (p & required) == required;

    public static int Count(Perm p)
    {
        var x = (int)p;
        var n = 0;
        while (x != 0)
        {
            x &= x - 1; // clears the lowest set bit
            n++;
        }
        return n;
    }
}
