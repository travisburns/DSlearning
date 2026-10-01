namespace Challenges.VirtualMemory;

public class Mmu
{
    public Mmu(int pageSize, int frames, string policy) => throw new NotImplementedException("Your code here");

    public int Faults => throw new NotImplementedException();

    public int Translate(int virtualAddress) => throw new NotImplementedException();

    public int? FrameOf(int page) => throw new NotImplementedException();

    public static int CountFaults(int[] pages, int frames, string policy) => throw new NotImplementedException();
}
