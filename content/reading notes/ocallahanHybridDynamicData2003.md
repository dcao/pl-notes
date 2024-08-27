---
aliases:
  - "Hybrid dynamic data race detection"
tags:
  - reading
year: 2003
authors:
  - O'Callahan, Robert
  - Choi, Jong-Deok    
status: Todo
source: https://dl.acm.org/doi/10.1145/781498.781528 
related:  
itemType: conferencePaper  
location: New York, NY, USA   
pages: 167–178  
DOI: 10.1145/781498.781528  
ISBN: 978-1-58113-588-6
scheduled: 2024-08-20
---
# Motivation

A **data race** happens when two threads access the same memory with no ordering constraint, and one of the accesses is a write. Unpredictable behavior! It's a dynamic occurrence. How do we automatically detect this?

> [!note]
> Can be mitigated with atomic operations. There are different *consistency*/*memory ordering* requirements you can impose: **strict** (operations seen by all threads simultaneously), **sequential** (operations should be seen in same order by all threads), **weak** (ops on synchronisation variables are sequentially consistent, no sync vars accessed until data ops complete, no data vars accessed until sync complete)
> 
> See [the Rustonomicon](https://doc.rust-lang.org/nomicon/atomics.html) and [Wikipedia](https://en.wikipedia.org/wiki/Weak_consistency) for more.

Prior (dynamic) approaches:

- *Lockset-based detection*: do two threads access common location without holding a lock? Efficient but coarse.
	- In depth, at each time step we keep track of the set of locks held by each thread
	- Then, if two different threads access the same memory location, and one of them is trying to do a write, if they aren't holding a common lock, they've violated the *lockset hypothesis*.
	- Report a potential race at each memory location
	- But programmers can write safe code that mutates shared data without locks, e.g., using *channels* to pass objects between threads.
	- e.g., if you have a **single memory arena** shared between threads, and are allocating local objects in the arena.
- *Happens-before detection*: two threads access shared memory in a **causally unordered way** (a kind of consistency model where we keep track of what ops effect what other ops). No false positives but ~5x slower in practice, and more false negatives.
	- We say $e$ happens before $j$ if $e$ is before $j$ on the same thread, or $e$ is a thread sending a message, and $j$ is receiving that message.
		- A message is generated on Java method calls: `thread.join()`, `thread.start()`, etc.
		- We also generate a message on shared mem writes and reads. Mem write is write and send, subsequent access is recv.
	- $e \to j$ means "e *effects* j."
	- If two events access the same memory, and one is a write, but neither $e \to j$ or $j \to e$, then there's a race.
	- Reports **subset of lockset-based reported**. But sometimes misses things because generate too many messages.
		- ![[Screenshot 2024-08-24 at 12.47.38 AM.png]]

# Contribution

**Combines performance of lockset-based with precision of happens-before**. Basically, perform lockset detection, and when doing happens-before detection, only record messages for Java thread primitives—`start()`, `join()`, `wait()`, and `notify()`. A data race must be positive for both lockset and limited happens-before.

This hybrid approach reduces false positives of lockset, but is faster and more sensitive than happens-before.

To optimize, we basically avoid recording *redundant events* for already data-raced memory locations.

- "If the thread, access type, and timestamp of a previous event $e_{i}$ match those of a new event $e_{n}$, and $e_{i}$’s lockset is a subset of the locks for $e_{n}$, then the new event is redundant according to the theorem below."

> [!danger] TODO
> There's more here but I'm not looking closely.