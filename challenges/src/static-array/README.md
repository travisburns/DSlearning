# Theatre seat booking

**The ticket.** A small theatre has rows of exactly 30 seats. The booking page needs to check and book seats instantly, and find a block of seats together for groups.

**Build** `SeatRow` in `SeatRow.cs`, backed by one fixed-size array (`bool[]`):

- `SeatRow(int seats)`.
- `bool Book(int seat)`: book it; return false if it was already taken or the number is outside the row.
- `bool IsFree(int seat)`.
- `int FreeCount`.
- `int FindBlock(int groupSize)`: the lowest seat number where `groupSize` free seats sit next to each other, or -1. One pass over the row.

**Rules.** Book and IsFree are O(1): jump straight to the index. FindBlock is a single O(n) scan.

**Run:** `dotnet test --filter Lesson=static-array`
