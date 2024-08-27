- other optimization
	- auto-parallel
- codegen (reg alloc, gc)

# Parsing

- Grammars: **regular** (rules must be single step), **context-free** (single non-terminal)
- Parsing derivations start from starting non-terminal
	- You can pick the **leftmost** or **rightmost** nonterminal to expand at each point
- Grammars can be **left recursive** $A \to A\alpha$ and/or **right recursive** $A \to \alpha A$
- Types of parsers...
	- **Top-down**: guess leftmost derivations, match away literals.
		- **LL($k$)** grammars. Must be right recursive.
		- **Recursive descent**: each function is a nonterminal. Can **backtrack** (exponential time) or be **predictive** (linear time)
		- Can construct parsing table, taking nonterminal and lookahead, returning predicted production.
	- **Bottom-up**: push literals items onto stack, turn them into nonterminals. Reverse rightmost derivation.
		- **CYK parsing**: Datalog rule `e(I, O)` means "does the string `s[I:O]` match nonterminal `e`?" Works for all context-free grammars.
		- **Earley parsing**: $O(n^2)$ for context-free. Keep track of state ("cursor") we're in for each rule. $$ \begin{aligned} E &\to T \bullet + \mathbf{id} \\ E &\to \mathbf{id} \bullet \\ T &\to E \bullet \\ \end{aligned} $$
	- **Packrat parsing**: recursive descent to do linear time parsing of any context-free language in lazy functional languages
		- Memoization table: columns are char positions, rows are nonterminals. At each cell, store parsed value and column index of where the rest of the input starts.
		- Create struct for column of memoization table. Each item contains pointer to another cell. Mutual recursion is only evaluated when needed.

See [[parsing]], [[fordPackratParsingSimple2002|Packrat parsing]].

## Syntax-directed translation

```
expr = expr_1 + term { expr.val = expr_1.val + term.val }
     | expr_1 - term { expr.val = expr_1.val - term.val }
     | term          { expr.val = term.val }
term = digit         { term.val = digit.lexval }
```

- **Syntax-directed translation** attaches rules/program fragments to grammar productions.
- **Syntax-directed definition**: attach **semantic rules** to specify associated analysis (**attribute**) for that non-terminal, in terms of attributes of children.
	- **Synthesized** attributes are defined in terms of children.
		- **S-attributed** definitions only have synthesized attributes.
	- **Inherited** are also defined in terms of itself and parent. Useful where parse tree doesn't correspond to AST. (e.g., right-recursive rules).
		- In **L-attributed** definitions, items that depend on siblings only depend on siblings before/to its left. Avoids dep graph cycles.
	- **Attribute grammar**: SDD with no side effects. Permits any eval order.
- **Syntax-directed translation scheme**: put program fragments inline in grammar.
	- **Postfix SDT**: put all rules at end of each rule. Equivalent to SDD.
	- Can transform left-recursive SDTSs into right-recursive ones. Can reason it out.

See [[2024-07-31 • attribute grammars, ssa, cps]] ([[ahoDragonBookGrammars2007|Dragon Book 5, 6.2.4: grammars & SSA]]).

# Intermediate representations

## SSA

```python
a1 = 2
b1 = 3
b2 = 4
if a1 > b2:
	c1 = 9
else:
	c2 = 4
c = phi(c1, c2)
```

- Every variable is only assigned to once. No redefinition, shadowing, or mutation.
	- For a given statement, useful for finding where each of those variables is defined and used in linear space.
	- Enables value numbering.
- Variables are joined after conditionals with $\phi$ nodes.
	- Same as finding optimal nesting in CPS.
	- CPS is useful since it's closer to machine code/TAC.
- Placement of $\phi$ nodes is calculated with **dominance frontiers**.
	- $b$ in dominance frontier of $a$ if $a$ dominates any predecessor of $b$, but not $b$.
	- When node $n$ defines `x`, all nodes in $n$'s dominance frontier need a $\phi$-function for `x`.

See [[2024-07-31 • attribute grammars, ssa, cps]] ([[ahoDragonBookGrammars2007|Dragon Book 5, 6.2.4: grammars & SSA]], [[appelSSAFunctionalProgramming1998|SSA is functional programming]]). Optionally [[continuation-passing style]].

## Continuation-passing style

- Continuation-passing style useful for optimization, and it's a kind of stylized machine code, so we can use it for code gen.
- **Adminstrative normal form** (ANF) gets you a lot of the same benefits!
	- Functions only called on atomics, any non-trivial expr is immediately let-bound. Reverse CPS!
	- Can do $\eta$-reduction: $\lambda x. f(x) \to f$
	- Propagates `let`-bindings up, babble-style!
	- Matches machine code closely

See [[2024-07-31 • attribute grammars, ssa, cps]], [[continuation-passing style]], [[flanaganEssenceCompilingContinuations1993|The essence of compiling with continuations]].

## Program dependence graphs

- Three kinds of **data dependences**:
	- **Flow dependences**: From def to use.
	- **Output dependence**: treat definition as a use of a variable. Def to def.
	- **Antidependence**: from use to next definition. Use to def.
	- The latter two used for ordering constraints for e.g., auto-parallelism.
- **Control dependences**: does $X$ determine if $Y$ runs?
	- There exists a path from $X$ to $Y$ where every node in the path other than $X$ and $Y$ is post-dominated by $Y$
	- $X$ isn't post-dominated by $Y$ itself.
	- i.e., from $X$, there's a path through $Y$ and another path around it.
	- ==do-while loops: not sure what happens. Use the formal definition==
- Program dependence graph combines both.
	- **Region nodes** can be used to avoid drawing hella edges. Each predicate should only have one true edge, one false edge. Multiple true edges can be collapsed into one region node. Region nodes can have multiple outgoing edges.
- Uses
	- **Program slicing**
		- **Backward** (what vars affect this assignment), **forward** (what will this assignment affect going forward)
		- Can also use dataflow analysis. Compute "relevant" vars. Remember to incorporate data & control dependences!
	- ==TODO==

See [[2024-08-14 • program dependence graphs, program slicing, lazy abstraction]] ([[ferranteProgramDependenceGraph1987|The program dependence graph and its use in optimization]], [[tipSurveyProgramSlicing1994|A survey of program slicing techniques]]), [[ahoDragon10112007#^h2y8li]].

# Optimizations

Misc. static optimizations that aren't mentioned elsewhere:

- **Value numbering**: hash each expression. If you see an already inserted expression, insert original variable.
- **Term rewriting**, **partial evaluation**, **algebraic reduction**: $x + 0 \rightsquigarrow x$
- **Peephole optimization**: look at assembly instructions and rewrite adjacent ones. Looking at assembly through a peephole!
- **Tail-call optimization**
- **Symbolic execution**

Runtime optimizations:

- **Just-in-time (JIT) compilers**. Can do better inlining, whole-program optimization, are more portable, don't need to recompile the world on code change. Slower load, can't share library code.
- **Profile-guided optimization**: get some benefits of JIT for AOT.

See [[2024-07-10 • optimizations and gc|program optimization]] ([[value numbering]]), [[Java Implementation and HotSpot Optimizations]]

## Pipelining

Single CPUs can execute multiple tasks at once.

- Pipelining: a task is made up of subtasks. Start one task, then when it executes next step, start next task, etc.
- You can pipeline within an instruction.
- **Software pipelining**: pipelining instructions.
- **Code scheduling**: reordering statements to maximize pipelining
	- Group together basic blocks into regions: subset of CFG that can be reached only through one entry block
	- Iterate through inner regions first, basic blocks in dependence order within regions, scheduling when no resource conflicts.

See [[2024-08-21 • auto-parallelization]] ([[ahoDragon10112007|Dragon Book 10, 11: Parallelism]]).

## Auto-parallelism

This is specifically "splitting up for loops" auto-parallelism. Maybe not super relevant these days...

- **Data parallelism** is "multiple processors split up the data, do the full pipeline on each"
	- versus **task parallelism** is "each processor is responsible for its own task, passes it on to the next person"
- Affine transform theory:
	- Iteration space (loop indices), data space (set of array elements accessed), and processor space (CPUs) each consist of a bunch of points.
	- These points can be in $n$-dimensional space. Iteration space and processor space dimensionality based on loop nesting, data space is flat.
	- **Polyhedral analysis**: points of an $n$-dimensional polyhedron.

See [[2024-08-21 • auto-parallelization]] ([[ahoDragon10112007|Dragon Book 10, 11: Parallelism]]), [[2024-08-14 • Justin, prelim targeted - auto-parallelization]].

# Code generation

## Register allocation

- **Register interference graph** is a graph of variables, where variables are connected if they're live at the same point.
- Solving register allocation is just solving **graph coloring problem**: how can we color graph nodes such that adjacent nodes don't have same color?
	- NP-complete, but we can approximate with **Chaitin's algorithm**
	- Find a node with fewer than $k$ edges. Remove it. Recurse for the rest of the graph. Re-add node with one of the remaining colors.
		- If the node doesn't have fewer than $k$ edges, mark it as problematic. Spilling will happen.
- Also linear scan approach. Sucks.
- Also naive (don't register allocate, always load from main memory). Sucks even more.

See [[register allocation]]

## Garbage collection

How can we automatically manage memory? How can we **detect** and **reclaim** garbage objects?

- Reference counting: `Rc<T>`
	- Can't reclaim cyclic pointer, inefficient (esp wrt short-lived stack variables that may increment/decrement the `Rc` often)
- **Stop-the-world**
	- **Mark-sweep**
		- **Trace** live objects from a **root set**.
		- Memory is **swept** (exhaustively examined) to find garbage objects.
		- Memory is freed by linking them to a **free list**: linked list of free memory spaces to allocate into.
		- Problems:
			- GC cost proportional to total heap size.
			- Fragmentation: garbage and live objects interspersed, hard to find space for big objects
			- Locality: objects of different ages all over the place
	- **Mark-compact**
		- No sweeping, but **compacting**: slide free objects down until contiguous. Freeing implicit.
	- **Copying**
		- Instead of separate mark and compact phase, copy objects to new space as they're marked.
- **Incremental**
	- Program is **mutator**
	- Generally, objects are **white** (garbage), **black** (live), or **gray** (object reached but immediate descendants haven't)
	- Synchronize with **read barriers** (turn white objects gray on read) or **write barriers** (record when a pointer is written)
		- **Snapshot-at-beginning** (save all pointers that are overwritten) or **incremental update** (if we overwrite pointer in black object, mark object gray to rescan)
	- **Baker's treadmill**: circle of linked items. New, Free, From, To.
- **Generational**
	- Multiple subheaps for objects of different ages
	- To update pointers in old objects
		- Indirection table, write barrier, ...

See [[wilsonUniprocessorGarbageCollection1992|Uniprocessor garbage collection techniques]].