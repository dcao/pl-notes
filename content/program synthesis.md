> [!note] See also
> A lot of these are adapted from my old notes (ca. WI21) from Nadia's CSE 291 class on Program Synthesis!

# The three dimensions of synthesis

There are three dimensions along which synthesis strategies vary:

- **Behavioral constraints**: how do you tell the system what the program should do? i.e., specification
	- Input lang/format?
	- Interaction model? Maybe not one-shot?
	- What happens when intent is ambiguous?
	- e.g., input-output examples, equivalent program, formal spec (pre/post conditions, types), natural language
- **Structural constraints**: what is the space of programs to explore?
	- Large enough to contain interesting programs, small enough to exclude garbage and enable efficient search
	- Built-in or user defined?
	- Can we extract domain knowledge from existing code?
	- e.g., Sketch/Rosette
- **Search strategy**: how do we search through the search space?
	- Synthesis is search: find program in space defined by structural constraints that satisfies behavioral constraints.
	- But this space is massive!
	- How do we find the program we want?
		- How do we *know* it's the program we want?
		- How can we leverage the above constraints to do this?
	- e.g.,
		- **Enumerative (explicit) search**: enumerate things in increasingly bigger sizes
		- **Stochastic search**
		- **Representation-based search**: use data structure to represent large set of programs (e.g., VSAs, e-graphs)
		- **Constraint-based search**: translate to constraints and use a solver (e.g., SMT, ILP)

# Syntax-guided synthesis

If you have a grammar, synthesizer generates programs according to that grammar.

**SyGuS** is a format/competition that unifies different syntax-guided approaches. Common input format & supporting tools (e.g., CVC4, Z3, etc.). A SyGuS problem has three parts:

- A **[[SAT and SMT solving#Different theories|theory]]**.
- A **spec** (logical formula) dictating what the synthesized function should do.
- A grammar.

To get from logical formula to input/output examples, we use **counter-example guided inductive synthesis (CEGIS)**. Give initial examples to synthesizer. Then use verification oracle to try to find a counter-example where it doesn't follow spec. Use as new input/output pair.

With **enumerative search**, we enumerate every possible program. In **bottom-up**, we start from nullary productions and iteratively deepen our search. In **top-down**, we start with the starting nonterminal and expand with productions. Kind of like [[parsing#Top-down vs. bottom-up|LR vs. LL]]!

There are ways of making this faster:

- **Observational equivalence**: if two programs return the same result for all in/out pairs, discard one.
	- General, doesn't require user input
	- But is less effective with more examples, and requires you to get back discarded programs when adding new examples.
- **User-specified equations**: have user provide rewrites, discard programs where rewrites could apply (i.e., only accept normal form programs)
- **Built-in equivalences**: make it impossible to represent equivalent programs in the grammar. Cool if you can get it, but you can't get it often.

# Representation-based search

With **representation-based search**, we build a data structure that represents the "good" parts of the search space, then search in that data structure.

- Useful if you need to return multiple results/rank them, and you can preprocess search space and use for multiple queries.
- Tradeoff: harder to build representation, easier to search late

One example of this is a **version space algebra (VSA)**. We build a data structure representing set of programs consistent with examples—a *version space*.

Operations:

- `learn : <input, output> -> VS`
	- Given an example, yield a version space of programs consistent with that example
- `intersect : VS -> VS -> VS`
	- Args: all programs consistent with one example consistent with all programs consistent with another
	- Returns: programs consistent with both
- `pick : VS -> program`
	- Pick a program in that version space

Implementation:

- DAG where each node represents a set of programs.
- Nodes are enum with three variants:
	- Direct set: explicit set of progrmas
	- Union node: set of programs of node is union of children
	- Join node: applies some function/operation to all combinations of children

> [!warning] TODO
> There's more info in the 291 notes—I haven't included them here since they're not quite relevant for the Prelim.