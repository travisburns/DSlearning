# A tiny CPU emulator

**The ticket.** Same teaching kit: students write programs for a made-up 4-register CPU and run them in the browser. Build the emulator core: the fetch–decode–execute loop.

**The instruction set.** Registers are `r0`–`r3` (ints, start at 0). One instruction per line, numbered from 0:

| Instruction | Meaning |
|---|---|
| `SET r, n` | r = n (n can be negative) |
| `MOV r, s` | r = s |
| `ADD r, s` / `SUB r, s` | r = r + s / r = r − s |
| `INC r` / `DEC r` | r = r + 1 / r = r − 1 |
| `JMP n` | jump to instruction n |
| `JZ r, n` / `JNZ r, n` | jump to n if r is zero / not zero |
| `OUT r` | append r's value to the output |
| `HALT` | stop |

Instruction names are case-insensitive; operands are separated by a comma and optional spaces.

**Build** `Cpu.Run(string[] program, int maxSteps = 1_000_000)` in `Cpu.cs`, returning a `CpuResult(int[] Registers, List<int> Output, int Steps)`:

- Check the **whole program before running** and throw `FormatException` for an unknown instruction, a wrong number of operands, a bad register name, a non-number where a number belongs, or a jump target outside `0..program.Length` (jumping to `program.Length` is allowed and means "stop").
- Run from instruction 0. Stop at `HALT` or when the program counter moves past the last instruction.
- `Steps` counts executed instructions (including `HALT`).
- If `maxSteps` instructions run without stopping, throw `TimeoutException`.

**Hint.** Parse each line once into a small record (opcode + operands) before running. Then the run loop is just: `var ins = code[pc]; pc++; switch (ins.Op) { … }`, where a jump simply sets `pc`.

**Run:** `dotnet test --filter Lesson=cpu-cycle`
