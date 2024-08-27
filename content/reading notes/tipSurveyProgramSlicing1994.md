---
aliases:
  - "A survey of program slicing techniques"
tags:
  - reading
year: 1994
authors:
  - Tip, Frank    
status: Todo 
related:  
itemType: book
scheduled: 2024-08-01
---
> [!note] See also
> [[2024-04-16 • CS 294, 13Tu – Program Slicing]]: https://www.ssw.uni-linz.ac.at/General/Staff/CS/Research/Publications/Ste99a.html ch 3, http://www.r-5.org/files/books/computers/compilers/writing/Keith_Cooper_Linda_Torczon-Engineering_a_Compiler-EN.pdf general

# Overview

A **[[program slicing|program slice]]** consists of the parts of a program that affect the values computed at some point of interest: a **slicing criterion**, which contains a program point and a set of variables we're interested in. The parts of a program that affect this criterion is the *program slice with respect to the criterion*.

There are a couple axes on which slicing techniques vary:

- Does the slice by itself constitute an executable program?
- Is the slice **static**—computed without assuming anything about program input—or **dynamic**—computed with respect to a specific input?

## Static slicing

We can compute static slices by determining transitively relevant statements via data flow and control flow dependencies—see [[2024-04-16 • CS 294, 13Tu – Program Slicing]]—or we can  [[repsProgramAnalysisGraph1998|state it as reachability]] in a [[ferranteProgramDependenceGraph1987|program dependence graph (PDG)]]!

We can compute *backwards* slices (find all things that influence this criterion from earlier), as well as *forwards* slices (find all things influenced by this criterion ahead). Their computation is similar.

## Dynamic slicing

We execute with respect to a specific variable assignment, and potentially a specific execution of a line. For instance, we might be interested in seeing "the first occurrence of statement on line $n$ in the history of the program." Additionally, if we have multiple reassignments in a loop, but one overwrites the other, we're only interested in seeing the actually relevant one.

# Applications

This is §7, but I've moved it up here!

- **Debugging and program analysis**
	- If a program computes a wrong value for $x$, the statements in the slice are (probably) to blame! (Or maybe you're missing a statement)
	- **Forward slicing**: off-by-one errors, inspect parts of a program that might be affected by a proposed modification
	- **Program dicing**: "if $x$ is correct but $y$ isn't, show statements that are in $y$'s slice but not $x$'s"
		- Doesn't work if multiple bugs, or if programs are *coincidentally correct*
	- Can detect **dead code** - statements not affecting any output, uninit vars
	- **Debugging** with dynamic slices
		- Composing slices to zoom in on potential location of bug
		- Heuristics for selecting statements likely to be involved in a bug
		- Using *flowback analysis* - more general dynamic slicing
- **Programming differencing** (i.e., git diffs)
	- Find components reflecting changed behavior—where slices have changed
- **Software maintenance**
	- Decompose program into set of components—*decomposition slice
- **Testing**
	- If all def-use pairs occur in a successful test we say a program satisfies a data flow testing criteria
	- With slicing, we can go stronger: enforce that every def-use pair influences ≥1 output value! *Output-influencing*
- **Compiler tuning**
	- Use dynamic slicing to detect redundant CSE
- **Parallelism?**
	- Several program slices executed in parallel, then splice them together in I/O-respecting way
- ==Stuff with modules==, etc.

# Data dependence and control dependence

Here, we're interested specifically about **flow dependence** (i.e., not [[ferranteProgramDependenceGraph1987#^cb6382|output dependence or antidependence]]). A statement $j$ is flow dependent on $i$ if a value computed at $i$ is used at $j$. Formally, this means that $i$ is a [[ahoDragonBookMachineindependent2007#Reaching definitions|reaching definition]] at $j$.

For a definition of control dependence, see [[ferranteProgramDependenceGraph1987#Control dependence|Ferrante et al]]. With structured control flow, given an `if` or `while`, whatever statements are inside this level of `if` or `while` are control flow dependence on the predicate.

# Methods for static slicing

## Basic algorithms

We're gonna look at a bunch of different algorithms that do the same thing but in different ways: static slicing of structured, single-procedure programs with scalar variables.

### Dataflow equations

One way to define a static slice $S$, a subset of program $P$, with respect to a criterion $(n, V)$ is having two properties:

1. $S$ is a valid program.
2. Wherever $P$ halts for an input, $S$ also halts, computing the same values for all variables in $V$ whenever the statement corresponding to node $n$ is executed.

This algorithm performs two distinct steps:

- Trace data dependences. Requires iteration to fixpoint in the presence of loops.
- Trace control dependences. For relevant predicates, trace their dependences.
	- We need this because of our definition that slices must run and run equivalently

At a broad level, for a criterion $(p, V)$ with at program point $p$ with a set of variables $V$, we perform a backwards dataflow analysis, where our analysis is the set of variables *relevant* to our slice. As we go backwards, if a relevant variable is defined at a statement, we replace that variable with the variables referenced in that definition. The predicate of a conditional statement is *indirectly* relevant if one if its statements is relevant. We must include the slice for the predicate in our overall slice.

Before analysis, we also note the statements that are control dependent on the current statement. If a statement is included in the slice, we must calculate include the slice of any predicates the statement is control dependent on.

This is the approach described in [[2024-04-16 • CS 294, 13Tu – Program Slicing]].

### Information-flow relations

We can define some *relations* that make statements about the *flow of information* that can be used to compute slices, with respect to a (sequence of) statement(s) $S$, a variable $v$, and an expression (control predicate or rvalue) $e$ in $S$:

- $(v, e) \in \lambda_{S}$ iff value of $v$ on entry to $S$ affects the value computed for $e$.
	- Backward: if 
- $(e, v) \in \mu_{S}$ iff computed value for $e$ *potentially* affects value of $v$ on *exit* from $S$.
	- Forward
- $(v_{1}, v_{2}) \in \rho_{S}$ iff value for $v_{1}$ on entry to $S$ affects value of $v_{2}$ on exit from $S$.

Let $E_{S}^v = \{ e \mid (e, v) \in \mu_{S} \}$; the set of all expressions in a statement $S$ with respect to variable $v$ where $e$ potentially affects the value of $v$ later on after $S$.

To get a backwards slice, we replace all statements in $S$ with no expressions in $E_{S}^v$ with empty statements. This means that the expressions in $S$ don't affect $v$'s later value at all, so they can be deleted. This yields the slice with respect to $v$'s final value.

Basically, build $\mu$ for all $S$. Then, for the variable we care about, see if it's in $\mu_{S}$. If not, delete.

To get a slice at an arbitrary point, insert a dummy assignment `v' = v` somewhere and take the slice of `v'`.

> [!note]
> To get a forward slice, use $\lambda_{S}$ instead of $\mu_{S}$.

To define the relations, we pattern match (i.e., perform structural induction) on the statement $S$. i.e., syntax-directed! 

![[Screenshot 2024-08-04 at 11.39.09 PM.png]]

Brief summary:

- For $\rho$
	- For sequencing, [relation *composition*](https://en.wikipedia.org/wiki/Composition_of_relations).
		- $a \cdot b = \{ (x, z) \mid \exists y. (x, y) \in a \land (y, z) \in b \}$
	- For assignment, value of vars in expression affects value of assigned var
		- Also, `id`, except for assigned var.
	- For conditionals, the vars in `e` could affect vars defined in $S_{1}$ and $S_{2}$. And inherit branches, identity
	- For loops, the vars in `e` could affect vars defined in $S$. Fixpoint.
- For $\lambda_{S}$
	- For sequencing, look at $\lambda_{S_{2}}$, and only look at variables that, coming from $S_{1}$, could affect variables coming into $S_{2}$. Combine this with whatever's in $S_{1}$.
	- For `v := e`, `e` is affected by all vars it references.
	- For `if e then S1 else S2`, `e`is affected by vars it references. Also include relations from `S1` and `S2`.
- For $\mu_{S}$
	- Sequencing: all the forward affects from $S_{2}$, plus those from $S_{1}$ that are also changed on $\rho_{S_{2}}$.
	- Assignment: $e$ affects $v$ on exit.
	- Conditional: predicate affects all defs in all branches. Also inherit branches
	- Loop: predicate affects all definitions in statements (control). Also, inherit $\mu_{S}$, but after fixpoint $\rho_{S}$ and all vars in predicate to all defs in the statement.

### Dependence graph approaches

Basically, use a [[ferranteProgramDependenceGraph1987|PDG]]! There are some mods you can add on:

- Add nodes for program (sub)expressions
- Explicitly add file descriptors
- Add finer-grained dependences between individual variables defined/used at program points.
	- Vertexes are boxes with separate ports for each variable defined or used at that program point.
	- Every box has an $\epsilon$ port, representing "execution" of that statement, and control predicates have a $\tau$ port, for their temporary value, for control dependence purposes.
	- A slice criterion is now a pair of source and sink ports we're interested in.

> [!note] For multi-procedure programs
> From [notes](https://docs.google.com/document/d/1jPs0RsDOefuK4OCEOcNpG7vXvtWS4KZUu1D_cqNtll0/edit#heading=h.ys1vb888bgmo):
> 
> > Note: for interprocedural static slices, one can find the corresponding SDG = system dependence graph for multi procedure programs. Then, new dependence between input and output parameters of each procedure call are explicitly represented in the SDG (summary edges). Then a two pass algorithm is used to extract the slices from an SDG.

# Methods for dynamic slicing

## Basic algorithms

### Dynamic flow concepts

The key sauce with dynamic flow concepts is that we want to distinguish between multiple executions of the same statement. This allows us to get more information, e.g., if an assignment is killed by a later execution of an assignment that occurs spatially earlier in the program source.

To do this, we formalize the notion of the execution history of a program as a *trajectory*. A statement occurrence $I^q$ stands for "the statement or control predicate $I$, which was the $q$th statement executed in our execution history." A trajectory is just an execution history: a list of statements executed on this execution path.

![[Screenshot 2024-08-05 at 12.23.09 AM.png]]

A dynamic slicing criterion $(x, I^q, V)$ contains the input of the program $x$, the statement occurrence $I^q$ we're interested in evaluating at, and the variables $V$ we want a slice for. A dynamic slice in this setting has similar properties to static slices from dataflow:

1. With input $x$, trajectory of $S$ is identical to trajectory of $P$ (where any statements not in $S$ are removed)
2. Identical values are computed for $V$ at $I^q$.
3. $I$ must appear in $S$.

To compute dynamic slices, we introduce three **dynamic flow concepts**; we call them these since these are kinda dataflow-y, but not exactly. It's three analyses, in the form of syntax-directed relations, that we build about our program:

1. **Definition-use (DU)**: *to* a use of a variable, *from* its most recent definition. i.e., from reaching definition to its use.
2. **Test-control (TC)**: *from* most recent occurrence of control predicate, *to* statements control dependent on that occurrence of predicate
3. **Identity (IR)**: different occurrences of the same statement.

Computing a set of statement occurrences $S$ to include in a slice is a fixpoint process. On each new iteration $S^{i + 1}$, we add occurrences that are in the *from* position of any relation where an item in $S^i$ is in the *to* position.

We need IR for termination in the presence of loops.

### Dynamic dependence relations

How could we use a PDG to 

- We could try marking *vertices* executed in a test set, and only include executed vertices in the slice. Imprecise: if there's an edge $v_{1} \to v_{2}$ between marked vertices, but definitions of $v_{1}$ aren't used in $v_{2}$, it's still added.
- We could try marking executed *edges*, and only including items along marked edges. However, an edge traversed through one iteration will be present in all subsequent iterations, even if the same dependence doesn't occur.
- The solution: create a distinct vertex in the PDG for each occurrence of a statement in the execution history.
	- Called a **dynamic dependence graph** (DDG). A criterion is an occurrence of a statement in the DDG.
	- This is similar to above!
	- Unfortunately, number of possible slices is $O(2^n)$.
	- Can compute a **reduced dynamic dependence graph** (RDDG): only add a new vertex if it can create a new dynamic slice.

# Future work

There are two main constraints with slices as described here:

1. Slices must contain a subset of original program's statements—and might need to be syntactically valid itself
	1. In some languages, you can't have empty `if`s. What then?
2. Slices are computed via data and control dependences
	1. If we do constant propagation in slicing (along with other [[2024-07-10 • optimizations and gc|program optimization]] techniques, e.g., symbolic execution), we might get smaller slices!
	2. Broadly, we can get this by transforming into IR, optimizing IR, maintaining mapping between source and (un)optimized IR, and getting slices from IR

# Conclusion

We include this here to show what else we haven't touched on:

- Interprocedural slicing
- Unstructured control flow
- Composite data types & pointers
- Concurrency

