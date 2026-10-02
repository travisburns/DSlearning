namespace Challenges.Emulator;

public record CpuResult(int[] Registers, List<int> Output, int Steps);

public static class Cpu
{
    private record Ins(string Op, int A, int B);

    private static readonly Dictionary<string, string> Shapes = new()
    {
        ["SET"] = "rn", ["MOV"] = "rr", ["ADD"] = "rr", ["SUB"] = "rr", ["INC"] = "r", ["DEC"] = "r",
        ["JMP"] = "j", ["JZ"] = "rj", ["JNZ"] = "rj", ["OUT"] = "r", ["HALT"] = "",
    };

    private static int Reg(string s, string line)
    {
        if (s.Length == 2 && (s[0] == 'r' || s[0] == 'R') && s[1] >= '0' && s[1] <= '3') return s[1] - '0';
        throw new FormatException($"Bad register '{s}' in: {line}");
    }

    private static int Num(string s, string line) =>
        int.TryParse(s, out var n) ? n : throw new FormatException($"Bad number '{s}' in: {line}");

    private static Ins[] Parse(string[] program)
    {
        var code = new Ins[program.Length];
        for (var i = 0; i < program.Length; i++)
        {
            var line = program[i].Trim();
            var space = line.IndexOf(' ');
            var op = (space < 0 ? line : line[..space]).ToUpperInvariant();
            var rest = space < 0 ? "" : line[(space + 1)..];
            if (!Shapes.TryGetValue(op, out var shape)) throw new FormatException($"Unknown instruction on line {i}: {line}");
            var args = rest.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (args.Length != shape.Length) throw new FormatException($"Wrong number of operands on line {i}: {line}");
            var vals = new int[2];
            for (var k = 0; k < shape.Length; k++)
            {
                vals[k] = shape[k] == 'r' ? Reg(args[k], line) : Num(args[k], line);
                if (shape[k] == 'j' && (vals[k] < 0 || vals[k] > program.Length))
                    throw new FormatException($"Jump target {vals[k]} out of range on line {i}");
            }
            code[i] = new Ins(op, vals[0], vals[1]);
        }
        return code;
    }

    public static CpuResult Run(string[] program, int maxSteps = 1_000_000)
    {
        var code = Parse(program);
        var r = new int[4];
        var output = new List<int>();
        var pc = 0;
        var steps = 0;
        while (pc < code.Length)
        {
            if (steps == maxSteps) throw new TimeoutException($"Still running after {maxSteps} steps");
            var ins = code[pc++];
            steps++;
            switch (ins.Op)
            {
                case "SET": r[ins.A] = ins.B; break;
                case "MOV": r[ins.A] = r[ins.B]; break;
                case "ADD": r[ins.A] += r[ins.B]; break;
                case "SUB": r[ins.A] -= r[ins.B]; break;
                case "INC": r[ins.A]++; break;
                case "DEC": r[ins.A]--; break;
                case "JMP": pc = ins.A; break;
                case "JZ": if (r[ins.A] == 0) pc = ins.B; break;
                case "JNZ": if (r[ins.A] != 0) pc = ins.B; break;
                case "OUT": output.Add(r[ins.A]); break;
                case "HALT": return new CpuResult(r, output, steps);
            }
        }
        return new CpuResult(r, output, steps);
    }
}
