# Vectorise hot loops with Vector&lt;T&gt;

**The ticket.** Our analytics service spends most of its CPU in four tiny loops over big arrays of numbers. Rewrite them with SIMD (`System.Numerics.Vector<T>`) so each instruction handles a whole row of values. Results must match the plain loops exactly (for floats: within rounding).

**Build** the static class `VectorMath` in `VectorMath.cs`:

- `int Sum(ReadOnlySpan<int> values)`: the sum (wrapping on overflow, like an `unchecked` loop).
- `int CountGreaterThan(ReadOnlySpan<int> values, int threshold)`: how many values are `> threshold`.
- `void Scale(Span<float> values, float factor)`: multiply every value in place.
- `float Dot(ReadOnlySpan<float> a, ReadOnlySpan<float> b)`: sum of `a[i] * b[i]`; `ArgumentException` if the lengths differ.

Every method must handle any length, including 0 and lengths that aren't a multiple of `Vector<T>.Count`.

**Hint.** `var n = Vector<int>.Count;` then loop `i` from 0 while `i <= length − n`, stepping by `n`, using `new Vector<int>(values.Slice(i))`. Finish the leftovers with a plain loop. For counting: `Vector.GreaterThan(v, limit)` gives −1 in lanes where it's true and 0 elsewhere, so *subtracting* it from a running vector counts matches without any `if`. `Vector.Sum(v)` adds up the lanes at the end.

**Run:** `dotnet test --filter Lesson=simd`
