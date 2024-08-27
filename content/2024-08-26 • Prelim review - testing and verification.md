# SAT and SMT solving

- SMT solver: SAT solver with **theories**. How should literals, vars, functions, and predicates be interpreted?
	- Theories: **arithmetic** (LIA), **fixed-width bit vectors**, **inductive data types**, **arrays**
- Theoretically, combining theories is undecidable
- In practice, it's very decidable lmao
	- Theories must be **signature-disjoint** (no overlapping symbols) and **stably infinite** (all satisfiable ground formulas are satisfiable if domain (universe) is infinite)
	- Split combined formula into two formulas—one with only theory A, other with only theory B.
		- Anywhere B stuff is mentioned in A, replace it with new symbol. Vice-versa.
	- For all new symbols we've introduced, randomly choose which are equal. Try and solve each theory's equation plus these equality constraints, repeat.
- SMT solvers are either **eager** (transform SMT equation into SAT equation )

See [[SAT and SMT solving]].

# Concolic execution

- For fuzzing. We want to automatically generate tests to cover many execution paths.
- Pure symbolic execution results in exponential blowup of paths.
- **Concolic execution**:
	- Random concrete variable assignment
	- Collect symbolic constraints as we go through path conditions
	- Change variables such that we activate a different path
- Can optimize by:
	- Simplifying symbolic exprs on the fly
	- Incrementally solving constraints

See [[godefroidDARTDirectedAutomated2005|DART: directed automated random testing]], [[CS 264 Notes]].

# Model checking

- **Model checking**: $M, \pi \models p$
	- $M$ is a **Kripke structure**: state machine with predicates that hold at specific states
	- $\pi$ is a path through $M$.
	- $p$ is a predicate
	- For software verification: checking that undesirable states are never reached.
- Model checking has three steps
	- **Abstraction**: build abstract model of program, as state machine and predicates ($var \geq 0$) that hold at each point.
	- **Verification**: Can state machine reach path where desired property doesn't hold?
	- **Counterexample-driven refinement**: If verification fails, we get a counterexample showing where state machine reaches bad state. Is this a real counterexample, or is this because our model isn't abstract enough?
- **Lazy abstraction**: iteratively refine our abstraction, instead of throwing it all out all at once
	- Create initial empty **control flow automaton** (edges are program statements/predicate branch, nodes have our predicates) from CFG
	- **Forward search**: collect predicates about already-abstracted variables, computing **reachable regions**: predicates representing set of program states that reach CFA node wrt abstracted predicates
		- Skip already explored subtrees.
	- **Backwards counterexample analysis**: compute **bad region**: set of program states that can reach error node from each node
		- Traverse path backwards from error
		- Check if intersection of reachable and bad region is empty
			- If so, path is actually unreachable. **Pivot node**.
			- Add unsat core to abstracted predicates, go forward.

## BDDs

- You can also represent model checking as construction/enumeration of a **binary decision diagram**: a graph representing a binary function saying if a formula holds true for each program state

## Temporal logic model checking

- Lots of quantifiers!
	- Computational Temporal Logic
		- Branching: $\mathbf{A}$ (for all paths), $\mathbf{E}$ (for some paths)
		- Linear time: $\mathbf{G} f$ ("always"), $\mathbf{F} f$ ("sometimes"), $\mathbf{X} f$ ("nexttime"), $f\ \mathbf{U}\ g$ ("until")
		- Can combine (or not) branching and linear time operations!

See [[henzingerLazyAbstraction2002|Lazy abstraction]], [[grafConstructionAbstractState1997|Construction of abstract state graphs with PVS]], [[clarkeVerificationToolsFinitestate1994|Verification tools for finite-state concurrent systems]].

# Concurrency

- **Data race**: two threads access same data at same time, one is write. Unpredictable behavior.
- **Lockset-based**: each thread has a set of locks on memory locations at each timestep
	- Data race if a thread doesn't have lock on memory
	- Efficient but can give false positives: e.g., arenas!
- **Happens-before**: ...
	- $e$ **happens before** $j$ if $e$ is before $j$ on the same thread, or $e$ is a thread sending a message, and $j$ is receiving that message.
		- Race when shared access and there's no clear happens-before relation for accesses
	- In fine-grained happens-before, we record messages for built-in synchronization primitives, **and** on shared memory write (send) and read (recv)
		- Sometimes misses things, very slow
		- Failure case: ![[Screenshot 2024-08-24 at 12.47.38 AM.png]]
- Hybrid approach: lockset **and** only record messages for built-in sync primitives
	- Reduce false positives of lockset while also being more sensitive than happens-before
	- To optimize, we basically avoid recording *redundant events* for already data-raced memory locations.

See [[ocallahanHybridDynamicData2003|Hybrid dynamic data race detection]]