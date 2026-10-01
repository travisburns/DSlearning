# Meeting rooms

**The ticket.** Two features for the office booking system.

1. A single room, many requests: accept as many meetings as possible (back-to-back is fine: one can start when another ends).
2. Facilities wants to know: how many rooms do we need so that **every** meeting gets a room?

**Build** in `Rooms.cs` (meetings are `(int Start, int End)` with Start < End):

- `List<(int Start, int End)> MaxMeetings(List<(int Start, int End)> requests)`: the accepted meetings, by end time.
- `int RoomsNeeded(List<(int Start, int End)> meetings)`: the most meetings running at the same moment.

**Hint.** For 1: repeatedly take the meeting that ENDS earliest among those that still fit. For 2: sort all starts and all ends; sweep through time counting meetings in progress.

**Rules.** O(n log n): 200,000 meetings must be fast.

**Run:** `dotnet test --filter Lesson=greedy`
