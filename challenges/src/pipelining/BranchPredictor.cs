namespace Challenges.Branches;

public class TwoBitPredictor
{
    public TwoBitPredictor(int tableBits)
    {
    }

    public bool Predict(long pc) => throw new NotImplementedException("Your code here");

    public void Update(long pc, bool taken) => throw new NotImplementedException();

    public double Run(IEnumerable<(long Pc, bool Taken)> trace) => throw new NotImplementedException();
}

public static class Pipeline
{
    public static long Cycles(int stages, long instructions, long mispredictions, int penalty) => throw new NotImplementedException();
}
