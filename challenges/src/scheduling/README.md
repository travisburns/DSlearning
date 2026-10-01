# Job scheduler simulator

**The ticket.** Ops wants to compare scheduling policies for a batch system before changing it. Write a simulator: given jobs with arrival times and how long they need, work out when each one finishes under each policy (one CPU, time in whole ms).

**Build** in `Scheduler.cs` (`record Job(string Name, int Arrival, int Burst)` is given). Each method returns `Dictionary<string, int>`: job name → finish time.

- `Fcfs(jobs)`: first come, first served (ties by name). The CPU idles if nothing has arrived yet.
- `Sjf(jobs)`: non-preemptive shortest job first: whenever the CPU is free, run the arrived job with the smallest Burst (ties: earlier arrival, then name). Use a `PriorityQueue`.
- `RoundRobin(jobs, quantum)`: a FIFO queue; a job runs for up to `quantum` ms. Jobs that arrive during a slice join the queue **before** the job that was just preempted goes to the back.
- `double AverageWait(jobs, finish)`: wait = finish − arrival − burst, averaged.

**Run:** `dotnet test --filter Lesson=scheduling`
