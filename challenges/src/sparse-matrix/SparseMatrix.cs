namespace Challenges.Sparse;

public class SparseMatrix
{
    public SparseMatrix(int rows, int cols) => throw new NotImplementedException("Your code here");

    public int Rows => throw new NotImplementedException();

    public int Cols => throw new NotImplementedException();

    public int NonZeros => throw new NotImplementedException();

    public void Set(int r, int c, double v) => throw new NotImplementedException();

    public double Get(int r, int c) => throw new NotImplementedException();

    public double[] Multiply(double[] x) => throw new NotImplementedException();

    public SparseMatrix Transpose() => throw new NotImplementedException();

    public IEnumerable<(int Col, double Value)> Row(int r) => throw new NotImplementedException();
}
