# Sort in place with guaranteed speed

**The ticket.** On our embedded device we can't allocate a second array (merge sort is out), and an attacker can feed us data designed to make quicksort hit its O(n²) worst case. We need O(n log n) **always**, with O(1) extra memory: heapsort.

**Build** in `HeapSort.cs`:

- `void Sort(int[] a)`: ascending, in place.
  1. Turn the array into a **max-heap**: sift down every parent, from the last parent back to index 0.
  2. Repeatedly swap the root (the biggest) with the last item of the heap part, shrink the heap by one, and sift the new root down.

**Rules.** No `Array.Sort`, `List.Sort`, LINQ or extra arrays.

**Run:** `dotnet test --filter Lesson=heapsort`
