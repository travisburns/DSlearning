namespace Challenges.Frames;

public class StackOverflowError(string message) : Exception(message);

public class CallStack
{
    public CallStack(int words)
    {
    }

    public int Depth => throw new NotImplementedException("Your code here");

    public int WordsUsed => throw new NotImplementedException();

    public void Call(int returnAddress, params int[] args) => throw new NotImplementedException();

    public int Arg(int i) => throw new NotImplementedException();

    public int AllocLocal(int initial) => throw new NotImplementedException();

    public int GetLocal(int i) => throw new NotImplementedException();

    public void SetLocal(int i, int value) => throw new NotImplementedException();

    public int Return() => throw new NotImplementedException();

    public IReadOnlyList<int> Trace() => throw new NotImplementedException();
}
