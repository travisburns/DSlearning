# A work queue with acks, redelivery and dead letters

**The ticket.** Background jobs (emails, image resizing, webhooks) need a queue that never loses a job when a worker crashes, and never lets one broken job jam the workers forever. Build the in-memory core of something like Azure Service Bus or SQS.

**Build** `MessageQueue` in `MessageQueue.cs`, with `record QueueMessage(long Id, string Body, int Deliveries)`:

- `MessageQueue(Func<long> nowMs, int visibilityTimeoutMs, int maxDeliveries)`.
- `long Send(string body)`: store a message and return its id (1, 2, 3, …).
- `QueueMessage? Receive()`: hand out the waiting message with the **lowest id**, with `Deliveries` counting this delivery (1 the first time). It is then *in flight*: hidden from other `Receive` calls for `visibilityTimeoutMs`. Null if nothing is waiting.
- `bool Ack(long id)`: the worker finished. Delete the message and return true, but only if it is in flight and its timeout hasn't passed; otherwise false.
- If a message's timeout passes without an ack, it goes back to waiting (keeping its id, so it comes out first again). But if it has already been delivered `maxDeliveries` times, it moves to `DeadLetters` instead.
- `int Waiting`, `int InFlight`, `IReadOnlyList<QueueMessage> DeadLetters` (in the order they died: earliest deadline first, lowest id first on a tie).

It must handle hundreds of thousands of messages, so no scanning everything on each call.

**Hint.** Three structures: a `SortedSet<long>` of waiting ids, a `Dictionary<long, …>` of message data, and a `PriorityQueue<long, (long Deadline, long Id)>` of in-flight ids by deadline. Before every operation, pop every in-flight message whose deadline has passed and put it back (or dead-letter it). An acked message may still be in the priority queue: skip it when it comes out.

**Run:** `dotnet test --filter Lesson=message-queues`
