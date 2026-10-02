# Call frames in raw memory

**The ticket.** The teaching-kit CPU needs function calls. There's no "method" in hardware: just one block of memory, a stack pointer, and an agreement about what each call pushes. Build that call-stack manager on a plain `int[]`.

**Build** `CallStack` in `CallStack.cs`:

- `CallStack(int words)`: the stack memory is `new int[words]`. It starts empty and **grows downward** from the end (like x64).
- `void Call(int returnAddress, params int[] args)`: push a new frame. **A call with `k` arguments uses exactly `k + 3` words** (the arguments, the return address, and two bookkeeping words of your choice, e.g. the argument count and the caller's frame pointer).
- `int Arg(int i)`: argument `i` of the current (innermost) call.
- `int AllocLocal(int initial)`: reserve **1 word** in the current frame for a local variable; returns its index within this frame (0, 1, 2, …).
- `int GetLocal(int i)`, `void SetLocal(int i, int value)`.
- `int Return()`: pop the current frame (its locals and everything `Call` pushed) and return its return address. `InvalidOperationException` if there is no frame.
- `int Depth` (number of frames), `int WordsUsed`.
- `IReadOnlyList<int> Trace()`: return addresses of all frames, innermost first (a stack trace).
- If a `Call` or `AllocLocal` doesn't fit, throw `StackOverflowError` (a class in the starter file) and leave everything unchanged.
- Bad argument or local indexes throw `ArgumentOutOfRangeException`.

**Hint.** Keep `sp` (the next free word, counting down from `words`) and `fp` (where the current frame's bookkeeping is). On `Call`: push args, push the arg count, push the return address, push the old `fp`, set `fp` to that spot. Everything else is arithmetic relative to `fp`. Locals go below `fp`.

**Run:** `dotnet test --filter Lesson=call-stack`
