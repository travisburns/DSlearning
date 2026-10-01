namespace Challenges.BitManipulation;

public static class BitTools
{
    public static int Pack(int r, int g, int b) => (r << 16) | (g << 8) | b;

    public static (int R, int G, int B) Unpack(int rgb) => ((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);

    public static int Darken(int rgb)
    {
        var (r, g, b) = Unpack(rgb);
        return Pack(r >> 1, g >> 1, b >> 1);
    }

    public static int StillInside(int[] log)
    {
        var x = 0;
        foreach (var id in log) x ^= id; // every pair cancels, leaving the unpaired id
        return x;
    }
}
