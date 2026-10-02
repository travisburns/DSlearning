namespace Challenges.Emulator;

public record CpuResult(int[] Registers, List<int> Output, int Steps);

public static class Cpu
{
    public static CpuResult Run(string[] program, int maxSteps = 1_000_000) => throw new NotImplementedException("Your code here");
}
