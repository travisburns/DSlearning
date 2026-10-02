# A branch predictor

**The ticket.** For the CPU teaching kit, add the piece that guesses which way each `if` will go, plus a cycle counter, so students can see *why* sorted data makes a loop faster.

**Build** in `BranchPredictor.cs`:

`TwoBitPredictor(int tableBits)`:
- A table of `2^tableBits` saturating counters, each 0–3, all starting at **1**. A branch at address `pc` uses entry `pc & (2^tableBits − 1)` (so two branches can share an entry).
- `bool Predict(long pc)`: predict taken if the counter is 2 or 3.
- `void Update(long pc, bool taken)`: taken → counter + 1 (max 3); not taken → counter − 1 (min 0).
- `double Run(IEnumerable<(long Pc, bool Taken)> trace)`: for each branch: predict, compare with what actually happened, then update. Returns the fraction predicted correctly (1.0 for an empty trace).

`static class Pipeline`:
- `long Cycles(int stages, long instructions, long mispredictions, int penalty)`: a `stages`-deep pipeline finishes `instructions` in `instructions + stages − 1` cycles, plus `penalty` for each misprediction. Zero instructions take zero cycles.

**Hint.** Two bits per branch means one surprise doesn't flip the prediction: a loop branch that is taken 9 times and then falls through once stays predicted "taken".

**Run:** `dotnet test --filter Lesson=pipelining`
