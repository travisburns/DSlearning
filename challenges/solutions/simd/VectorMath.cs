using System.Numerics;

namespace Challenges.Simd;

public static class VectorMath
{
    public static int Sum(ReadOnlySpan<int> values)
    {
        var n = Vector<int>.Count;
        var acc = Vector<int>.Zero;
        var i = 0;
        for (; i <= values.Length - n; i += n) acc += new Vector<int>(values.Slice(i));
        var total = Vector.Sum(acc);
        for (; i < values.Length; i++) total = unchecked(total + values[i]);
        return total;
    }

    public static int CountGreaterThan(ReadOnlySpan<int> values, int threshold)
    {
        var n = Vector<int>.Count;
        var limit = new Vector<int>(threshold);
        var counts = Vector<int>.Zero;
        var i = 0;
        for (; i <= values.Length - n; i += n) counts -= Vector.GreaterThan(new Vector<int>(values.Slice(i)), limit);
        var total = Vector.Sum(counts);
        for (; i < values.Length; i++)
            if (values[i] > threshold) total++;
        return total;
    }

    public static void Scale(Span<float> values, float factor)
    {
        var n = Vector<float>.Count;
        var f = new Vector<float>(factor);
        var i = 0;
        for (; i <= values.Length - n; i += n) (new Vector<float>(values.Slice(i)) * f).CopyTo(values.Slice(i));
        for (; i < values.Length; i++) values[i] *= factor;
    }

    public static float Dot(ReadOnlySpan<float> a, ReadOnlySpan<float> b)
    {
        if (a.Length != b.Length) throw new ArgumentException("Lengths differ");
        var n = Vector<float>.Count;
        var acc = Vector<float>.Zero;
        var i = 0;
        for (; i <= a.Length - n; i += n) acc += new Vector<float>(a.Slice(i)) * new Vector<float>(b.Slice(i));
        var total = Vector.Sum(acc);
        for (; i < a.Length; i++) total += a[i] * b[i];
        return total;
    }
}
