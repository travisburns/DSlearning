namespace Challenges.Bits;

[Flags]
public enum Perm { None = 0, Read = 1, Write = 2, Delete = 4, Share = 8, Admin = 16 }

public static class Permissions
{
    public static Perm Grant(Perm p, Perm add) => throw new NotImplementedException("Your code here");

    public static Perm Revoke(Perm p, Perm remove) => throw new NotImplementedException();

    public static Perm Toggle(Perm p, Perm flip) => throw new NotImplementedException();

    public static bool Has(Perm p, Perm required) => throw new NotImplementedException();

    public static int Count(Perm p) => throw new NotImplementedException();
}
