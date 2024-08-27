---
aliases:
  - "Dragon Book 9: Machine-independent optimization"
  - dataflow analysis
tags:
  - reading
year: 2007
editors:
  - Aho, Alfred V.
  - Lam, Monica S.
  - Sethi, Ravi
  - Ullman, Jeffrey D.
status: Todo
related:
  - "[[ahoCompilersPrinciplesTechniques2007]]"
itemType: bookSection
publisher: Pearson Addison-Wesley
location: Boston Munich
ISBN: 978-0-321-48681-3 978-0-321-49169-5
scheduled: 2024-07-18
---
> [!summary]
> If backwards, $\mathrm{IN}[B] = f_{s}(\mathrm{OUT}[B])$, $\mathrm{OUT}[B] = \land_{S, succ(B)}\ \mathrm{IN}[S]$
>
> **Kinds of analyses**:
> Reaching: what definitions are relevant at program point?
> Availability: Has an expression as defined at this point been used before? Is it *available* for use?
> Liveness: Will an expression as defined at this point be used again later? Is it still *alive* and will be used later?
> Constant propagation: Each var is $\top = UNDEF$, $\bot = NAC$, or a constant value
>
> **Optimizations**:
> Constant folding: constant propagation
> Common subexpression elimination, code motion: partial redundancy elimination
> Dead-code elimination: liveness
> Copy propagation

Let's discuss basic opportunities for global optimization!

Most global optimizations rely on **data-flow analyses**—algorithms that gather info about a program. These analyses all specify some property that must hold every time some instruction in a program is executed. The analyses differ in what they compute. For example:

- **Constant-propagation**: does a variable contain a unique constant value at some point?
- **Liveness analysis**: at this point in the program, will a variable's value be overwritten before it is read again?

# The principal sources of optimization

Using high-level languages often introduces redundant operations. For example, if you do array access via `A[i][j]`, you're doing pointer arithmetic under the hood, which might end up being duplicated. In this section, we provide some examples of *semantics-preserving* transformations/optimizations.

- **Global common subexpressions**: if an expression $E$ was previously computed and the values of the variables in $E$ haven't changed since the previous computation.
- **Copy propagation**: If we have a copy statement `x = v` somewhere, wherever we use `x` afterwards, we should use `v` instead. This might not seem to change anything, but this helps improve dead-code elimination. Speaking of!
- **Dead-code elimination**: if a statement computes values that are never used, it can just be removed. This is why copy propagation is important; if we have `x = v; y = 2 * x`, with copy propagation + dead-code elim we can remove `x` entirely!
- **Constant folding**: deducing at compile time that an expression's value is constant and using that constant value
- **Code motion**: If an expression in a loop yields the same result on every iteration, it's taken out of the loop ^9d6c9d
 	- e.g., `while (i <= x - 2)` becomes `t = x - 2; while (i <= t)`
- **Induction variables & strength reduction**: if a variable changes by a constant `c` on each reassignment, it's an induction variable. Strength reduction is replacing an expensive op (e.g., multiplication) with a cheaper one (e.g., addition).

# Intro to dataflow analysis

**Dataflow analysis** refers to techniques that derive info about flow of data along execution paths. For example, dead code analysis is "do any execution paths use this assignment?" Global common subexpression elimination is "do two textually identical expressions evaluate to the same value along all execution paths?"

## The dataflow abstraction

A program is a series of transformations on program state—values of variables. The input state of a statement is associated with the **program point *before*** a statement, while the output state is associated with the **program point *after*** a statement.

An execution path is a sequence of points such that:

1. $p_{i}$ immediately precedes a statement and $p_{i + 1}$ immediately follows that statement, or
2. $p_{i}$ is at the end of some block and $p_{i + 1}$ is the beginning of a successor block.

In dataflow analysis, we don't distinguish between paths taken to reach a program point, and we don't keep track of entire states, just what we need for an analysis. For example:

1. To help users with debugging, we might want to know *all* the values a variable might take on at a program point, and where those values were defined. Maybe a variable `a` is one of $\{ 1, 243 \}$ and was defined at either statements $d_{1}$ or $d_{3}$. The definitions that *may* reach a program point along some path are **reaching definitions**.
2. If a variable `x` is reached by only one definition (i.e., `x` only ever refers to one definition), and the definition is a constant, we can replace `x` with the constant. However, if several definitions reach `x`, we can't do this constant folding. We only do constant folding if there is a unique reaching definition for the variable, and it assigns a constant. When doing analysis, we only record const-ness, not necessarily all possible values or definitions.

## The dataflow analysis schema

Every program point has a **dataflow value**, an abstraction of the set of all program states that can be observed for that point. The set of possible dataflow values is the **domain**.

For example, for reaching definitions, we care about recording subsets of definitions; statements where definitions occur. This would be the dataflow value for a program point, and the domain is the set of all subsets of definitions.

The dataflow value before and after a statement $s$ is denoted with $\mathrm{IN}[s]$ and $\mathrm{OUT}[s]$. The **dataflow problem** is to find a solution to a set of constraints on $\mathrm{IN}[s]$'s and $\mathrm{OUT}[s]$'s, for all statements $s$ in the program.

There are two sets of constraints.

### Transfer functions

Transfer functions are constraints on dataflow values based on the semantics of statements themselves. For example, if `a` has value $v$ before executing `b = a`, after executing this statement, both `a` and `b` will have value $v$. The relationship between dataflow values before and after statements is called a **transfer function**.

Information can propagate in one of two directions:

- **Forward-flow problem**: the transfer function operates on the pre-state, returning to the post-state:

$$
\mathrm{OUT}[s] = f_{s}(\mathrm{IN}[s])
$$

- **Backward-flow problem**: the transfer function converts a dataflow value after the statement to a new one before the statement:

$$
\mathrm{IN}[s] = f_{s}(\mathrm{OUT}[s])
$$

### Control-flow constraints

Control-flow constraints on dataflow values are derived from the flow of control. For instance, within a basic block, since statements just execute one after another, we know that the control-flow value out of some statement $s_{i}$ must be the same as the value into the following statement $s_{i + 1}$:
$$
\mathrm{IN}[s_{i + 1}] = \mathrm{OUT}[s_{i}]
$$

Between basic blocks, since basic blocks might have multiple predecessors, often we will do union operations or things like that, e.g.,
$$
\mathrm{IN}[B] = \bigcup_{\text{P a predecessor of B}} \mathrm{OUT}[P]
$$

## Dataflow schemas on basic blocks

Since the goings-on within basic blocks are pretty simple, we can define the above operations on basic blocks as a whole:

- $\mathrm{IN}[B] = \mathrm{IN}[s_{1}]$, and $\mathrm{OUT}[B] = \mathrm{OUT}[s_{n}]$
 	- This is useful for writing control flow constraints between basic blocks.
 	- We write the constraints acting on basic blocks, then rewrite them to reference statements.
- Transfer functions can operate on basic blocks.
 	- In forward direction: $\mathrm{OUT}[B] = f_{B}(\mathrm{IN}[B])$, where $f_{B} = f_{s_{n}} \circ \cdots \circ f_{s_{1}}$
 	- or in backward direction: $\mathrm{IN}[B] = f_{B}(\mathrm{OUT}[B])$, where $f_{B} = f_{s_{1}} \circ \cdots \circ f_{s_{n}}$

These equations normally don't have a unique solution. But we want to find the most "precise" solution.

## What can we use dataflow analyses for

A lot!

### Reaching definitions

Where might a variable `x` have been defined at program point $p$? A definition $d$ **reaches** point $p$ if there is a path from point immediately after $d$ to $p$, such that $d$ isn't *killed* on this path. A definition is **killed** if there is any other definition of `x` along that path. A definition is any statement that *may* assign a value to `x`.

We want to perform an analysis that records which definitions—of any variable—are relevant (i.e., *reaching*) at a particular program point. So for instance:

```C
d1: x = 1       // {d1}
d2: y = 2       // {d1, d2}
d3: z = 4       // {d1, d2, d3}
d4: x = 2       // {d2, d3, d4} since x has been killed.
```

So how might we write the equations for this? First, let's look at the transfer equations. Let's look at a definition:

```
d0: u = v + w
```

This statement "generates" a definition $d_{0}$ of `u` and "kills" all other definitions of the program that define `u`, whether before *or after* this point. Remember that the dataflow value of each program point is the set of definitions that are live at a program point, for all variables. After this statement is executed, $d_{0}$ should be added to the dataflow value, while all other definitions that define `u` should be killed. We encode this intuition as follows:
$$
f_{d}(x) = gen_{d} \cup (x - kill_{d})
$$
where $gen_{d}$ is the set of definitions *generated* by this statement—in this case, $\{ d_{0} \}$—while $kill_{d}$ is the set of definitions killed by this statement—any prior definition that defines `u`.

> [!note]
> The concept of $gen$ and $kill$ sets occurs a lot in other contexts:
>
> - As $ref$ and $def$ in [[2024-04-16 • CS 294, 13Tu – Program Slicing]]
> - As $use$ and $def$ in [[ferranteProgramDependenceGraph1987|The program dependence graph and its use in optimization]], particularly in the context of *def-use chains*

Why do we do all other definitions that define `u`, and not just definitions before? To be conservative, we assume that all edges of a flow graph can be traversed, even if this isn't necessarily the case, as in the following program:

```C
if (a == b) mayRun();
else if (a == b) neverRuns();
```

We can generalize these operations to blocks as well: $$ \begin{aligned}
f_{B}(x) &= gen_{B} \cup (x - kill_{B}) \\
kill_{B} &= kill_{1} \cup \cdots \cup kill_{n} \\
gen_{B} &= gen_{n} \cup (gen_{n - 1} - kill_{n}) \cup (gen_{n - 2} - kill_{n - 1} - kill_{n}) \cdots (gen_{1} - kill_{2} - \cdots - kill_{n})
\end{aligned} $$
Basically, $kill_{B}$ is all definitions killed in the basic block, and $gen_{B}$ are all definitions generated in the basic block that are not killed by subsequent statements in that same basic block. A definition in $gen_{B}$ is also referred to as *downwards exposed*.

Note that in a basic block, a variable can be in both the *kill* and *gen* set. If it appears in both, its *gen*-ness takes precedent, since set difference on the *kill* set is applied first. For instance:

```C
           // gen  kill
d1: a = 3  // {d1} {d2} -- we kill all other definitions, forward or back!
d2: a = 4  // {d2} {d1}

           // basic block
           // gen: {d1} cup ({d2} - {d2}) = {d1}
           // kill: {d2} cup {d1}         = {d1, d2}
```

For our control-flow equations, we do:
$$
\mathrm{IN}[B] = \bigcup_{\text{P a predecessor of B}} \mathrm{OUT}[P]
$$
If a basic block has two predecessors, the definitions of *both* basic blocks *may* reach this one. Union is called the **meet operator** in dataflow schemas, which is the operator used to create a summary of contributions from different paths at the confluence of those paths.

Thus, the summary of our equations is as follows: $$ \begin{aligned}
\mathrm{OUT}[\mathrm{ENTRY}] &= \varnothing \\
\mathrm{IN}[B] &= \bigcup_{\text{P a predecessor of B}} \mathrm{OUT}[P] \\
\mathrm{OUT}[B] &= gen_{B} \cup (\mathrm{IN}[B] - kill_{B}) \\
\end{aligned} $$
We can find a solution to this with an iterative algorithm that just repeatedly calculates $\mathrm{IN}$ and $\mathrm{OUT}$ for each basic block (in that order), repeating until least fixpoint.

> [!definition] Least fixpoint
> When we say *least* fixpoint, we mean that this fixpoint is contained in all other fixpoints.

### Liveness analysis

> [!note] See also
> <https://en.wikipedia.org/wiki/Live-variable_analysis>

An example of a backward-flow dataflow problem. In *liveness analysis*—specifically, live variable analysis—we want to know: given a variable `x` and a program point $p$, does the value of `x` at $p$ get used later on in the program? If so, it is *live* at $p$. Otherwise, it's *dead*.

Here, instead of asking, "what definitions of `x` are potentially used at $p$," we're asking, "does the definition of `x` at $p$ get used in the future?" The former question is asking about previous definitions, and so is a forward-flow. The latter asks about future uses, and so is a backward-flow. If a variable is used at some point in the program, we want to propagate this information *backwards*, so that earlier program points know that later in the program, the value is used, and thus the variable is lived.

This is useful for e.g., register allocation. If a value is computed in a register within a block, we don't need to keep it there if it's dead at the end of the block.

Let's look at the following basic block as an example:

```
a = f(b * c)
b = 3
c = 4
```

At the point before the basic block, since `a`, `b`, and `c` were re-defined, we want them removed from the live variables list. However, we want to add `b` and `c`, since they were used before their redefinition in the block. With respect to the point before the block, they are used again in the basic block before getting redefined, meaning that at that point, they are live!

We include `b` and `c` into the *gen* set, since they've been used before they've been defined in this basic block. We want these variables to be added to our analysis value, since them being used before a definition means that at the start of the basic block, they are live.

However, `a`, `b`, and `c` are all in the *kill* set, since they're all defined within this basic block. When propagating backwards, we want to remove everything in the *kill* set—removing everything that has been defined in this basic block—but then add everything in the *gen* set—adding everything where the use is before the definition, meaning the variable is live before this basic block, since we know for sure it is used within the basic block but before a re-definition.

We encode this intuition as follows:
$$
\mathrm{IN}[B] = gen_{B} \cup (\mathrm{OUT}[B] - kill_{B})
$$

- $gen_{B}$ is the set of variables used in $B$ ==before any assignment in that basic block==.
- $kill_{B}$ is the set of variables defined in $B$.

we also include the base case $\mathrm{IN}[\mathrm{EXIT}] = \varnothing$, and the control flow equation:
$$
\mathrm{OUT}[B] = \bigcup_{\text{S a successor of B}} \mathrm{IN}[S]
$$
In the algorithm, we calculate $\mathrm{OUT}$ before $\mathrm{IN}$.

### Available expressions

This is used for global common subexpression detection. An expression `x + y` is **available** at point $p$ if it doesn't need to be recomputed at $p$; i.e., *every* path from the entry node to $p$ evaluates `x + y`, and there are no subsequent assignments to `x` or `y` between the last occurrence of the expression and $p$.

The intuition is: "at $p$, has `x + y` been evaluated as-is before?"

Confusingly, this also uses "generating" and "killing," but with different definitions to the above. An expression is generated if it is used in a statement, and it is killed whenever a variable it references is redefined. This is a forward-flow problem.

For our control flow equation, the meet operation is intersection instead of union, because we want expressions that are available in **all** branches ("every path"); if it's not available in one branch, that means it can't be shared with other branches, and so isn't available.

In sum: $$ \begin{aligned}
\mathrm{OUT}[\mathrm{ENTRY}] &= \varnothing \\
\mathrm{OUT}[B] &= gen_{B} \cup (\mathrm{IN}[B] - kill_{B}) \\
\mathrm{IN}[B] &= \bigcap_{\text{P a predecessor of B}} \mathrm{OUT}[P] \\
\end{aligned} $$

Since we do intersection, our initial assumption is that $\mathrm{OUT}[B] = U$, where $U$ is everything.

# Dataflow formally

We're gonna back up and discuss a broader theoretical framework for dataflow analysis. This framework will allow us to answer the following questions for different dataflow problems:

1. Under what circumstances is the iterative algorithm used for dataflow analysis correct?
2. How precise is this solution?
3. Will the algorithm converge?
4. What's the meaning of the solution to the equations?

A dataflow analysis framework $(D, V, \land, F)$ consists of:

1. A **direction** of the dataflow $D$, either *forwards* or *backwards*.
2. A **semilattice**, which includes a *domain* of values $V$ and a *meet operator* $\land$
3. A family $F$ of transfer functions from $V$ to $V$. This must include functions that can handle the boundary conditions—constant transfer functions for ENTRY and EXIT.

## Semilattices

> [!note] See also
> egglog!

A **semilattice** is a set $V$ and a binary meet operator $\land$ with three properties:

1. **Idempotency**: $x \land x = x$
2. **Commutativity**: $x \land y = y \land x$
3. **Associativity**: $x \land (y \land z) = (x \land y) \land z$

A semilattice has a top element $\top \land x = x$ and a bottom element $\bot \land x = \bot$.

### Partial orders

For more on partial orders, see [[denotational semantics and domain theory]].

A semilattice forms a partial order, where the partial ordering operation is defined as:
$$
x \sqsubseteq y \stackrel{\text{def}}{=} x \land y = x
$$
> [!note]
> Another way of phrasing this: $m = a \land b \iff m \sqsubseteq a \land m \sqsubseteq b$

When the meet operator is set union, supersets are on the left. When the meet operator is set intersection, subsets are on the left. In general, we say that the "greatest" solution is the most precise. ^0f06bd

Because of how we've defined top and bottom, this means that bottom is the "least" element—$\forall x. \bot \sqsubseteq x$ and top is the "most" element—$\forall x. x \sqsubseteq \top$.

A **greatest lower bound** of a set of elements $x_{0}, \dots, x_{n}$ is an element $g$ such that $g \sqsubseteq x_{i}$ and $\forall h, i. h \sqsubseteq x_{i} \implies h \sqsubseteq g$.

> [!note] Relationship with lubs
> We talk about lubs in the notes linked above. What's the relationship between glbs and lubs?
>
> In semilattices as we've discussed here, the meet operation returns the greatest lower bound. Since $x \sqsubseteq y$ only if $x \land y = x$, $x \land y \sqsubseteq x$ by reflexivity, and $x \sqsubseteq y$ by definition. There is also a *join* operation, which returns the lub between two elements. A full *[[lattice]]* contains both a meet *and* join operation. Here, we present meet semilattices.

The **height** of a lattice is the largest number of relations in any ascending chain (a chain where elements don't equal) in the poset.

### Lattice diagrams

We can draw diagrams of lattices, pointing from top to bottom:

![[Screenshot 2024-07-21 at 11.41.43 PM.png]]

This is the semilattice for sets with union as meet.

### Product lattices

- The domain of a product lattice is $A \times B$.
- The meet is $(a, b) \land (a', b') \stackrel{\text{def}}{=} (a \land a', b \land b')$.
- The partial ordering op is $(a, b) \sqsubseteq (a', b') \stackrel{\text{def}}{=} a \sqsubseteq a'\ \&\ b \sqsubseteq b'$

With definitions, we can regard the total lattice as a product of lattices with two elements: $\top = \varnothing$ and $\bot = \{ d \}$.

## Transfer functions

The family of transfer functions $F : V \to V$ must satisfy the following properties:

- $F$ has an identity function $I$.
- $F$ is closed under composition. $f, g \in F \implies g \circ f \in F$.

Additionally, a framework can have a few properties depending on the transfer function $f$:

- The framework is **monotone** if $f$ is monotone.
 	- $x \sqsubseteq y \implies f(x) \sqsubseteq f(y)$
 	- $f(x \land y) \sqsubseteq f(x) \land f(y)$.
- The framework is **distributive** if $f$ is distributive.
 	- $f(x \land y) = f(x) \land f(y)$

## Iterative algorithm

Forward:

```
OUT[entry] = initial value;
for (each basic block B other than entry) {
 OUT[B] = top
}

while (changes to any OUT occur) {
 for (each basic block B other than entry) {
  IN[B] = meet(OUT[P] if P a predecessor of B)
  OUT[B] = f(IN[B])
 }
}
```

Backward:

```
IN[exit] = initial value;
for (each basic block B other than entry) {
 IN[B] = top
}

while (changes to any OUT occur) {
 for (each basic block B other than entry) {
  OUT[B] = meet(OUT[S] if S a successor of B)
  IN[B] = f(OUT[B])
 }
}
```

This algorithm has a few properties:

1. If this converges, it's a solution to the dataflow equations
2. If the framework is monotone, this is the maximum fixedpoint.
 1. A maximum fixedpoint is a solution with the property that in any other solution, the values of $\mathrm{IN}[B]$ and $\mathrm{OUT}[B]$ are $\leq$ the corresponding values of the MFP.
3. If the semilattice of the framework is monotone and of nite height, then the algorithm is guaranteed to converge.

## What does this mean?

What does the solution mean from a program semantics standpoint? To explore this, let's considering the entry of a basic block $B$. What does the dataflow value mean at this point? Let's consider three different possible solutions:

- In the **ideal** solution, we would find the meet between all *possible* paths from the entry to $B$, where *possible* means there is some computation of the program that follows that path.
 	- Any answer *smaller* is a conservative safe estimate.
 	- Any answer *greater* than this ideal solution is incorrect.
- Finding the above is undecidable. In the **meet-over-paths** (MOP) solution, we find the meet between *all paths* from the entry to $B$. ^6a3dc5
 	- $\mathrm{MOP}[B] \leq \mathrm{IDEAL}[B]$
 	- This doesn't have a direct algorithm, since "all paths" is unbounded in the presence of cycles
- The **maximum fixpoint** (MFP) solution is what we get from our algorithm
 	- Compared to MOP, MFP is eager, immediately applies meet on confluence, instead of waiting to find all paths.
 	- If the framework is distributive, $\mathrm{MFP}[B] = \mathrm{MOP}[B]$
 	- Otherwise, $\mathrm{MFP}[B] \leq \mathrm{MOP}[B]$
 	- This is because in $\mathrm{MFP}$, we visit basic blocks in arbitrary order. Additionally, we apply the meet operator to dataflow values obtained so far, including ones introduced artificially during initialization.

# Constant propagation

Let's walk through a worked example of dataflow analysis: **constant propagation**. This dataflow framework, unlike the previous frameworks discussed, has two interesting properties:

1. It has an unbounded set of possible dataflow values, even for a fixed flow graph.
2. It is not distributive.

## Dataflow values

The set of dataflow values is a product lattice, with one component for each variable in a program. The lattice for a single variable consists of the following:

- All constants of correct variable type
- $\mathrm{NAC}$: not-a-constant. If a variable doesn't have a constant value, it's assigned to this.
- $\mathrm{UNDEF}$: undefined. The variable hasn't been assigned a value yet.

With these values, we can define the meet operation as follows: $$ \begin{aligned}
\mathrm{UNDEF} \land v &= v \\
\mathrm{NAC} \land v &= \mathrm{NAC} \\
c \land c &= c \\
c_{1} \land c_{2} &= \mathrm{NAC} \\
\end{aligned} $$

This means that $\top = \mathrm{UNDEF}$ and $\bot = \mathrm{NAC}$.

### Transfer functions & monotonicity

Let $m' = f_{s}(m)$, where $m$ and $m'$ are dataflow values. $f_{s}$ has the following properties:

- If $s$ isn't an assignment, $f_{s}$ is identity.
- If the RHS is of the form $y + z$, then
 	- $m'(x) = m(y) + m(z)$ if $m(y)$ and $m(z)$ are consts
 	- $\mathrm{NAC}$ if either are $\mathrm{NAC}$
 	- $\mathrm{UNDEF}$ otherwise
- Function calls or pointer assignments or whatever else are $\mathrm{NAC}$.

This captures the intuition of constant propagation. If the operands have constant values, we can compute the constant values. If they don't, we have to give up. If any of the values are undefined, this is also undefined. Notice that $\mathrm{NAC}$ takes precedence over $\mathrm{UNDEF}$. We only assign $\mathrm{UNDEF}$ if we're sure about that.

This is monotone. We can show that $x \sqsubseteq y \implies f_{s}(x) \sqsubseteq f_{s}(y)$.

But it's ==not distributive==! Consider the following example:

![[Screenshot 2024-07-22 at 1.03.17 PM.png]]

We know that in $B_{3}$, `z` can be known to have value `5`. But at the start of the block, in the iterative algorithm, we try to do the meet between `x = 2` and `x = 3`, and similarly between `y = 3` and `y = 2`. This results in `z` being $\mathrm{NAC}$.

Formally, let $f_{i}$ be the transfer function at block $B_{i}$. If this were distributive, we would expect $f_{3}(f_{1}(m_{0}) \land f_{2}(m_{0})) = f_{3}(f_{1}(m_{0})) \land f_{3}(f_{2}(m_{0}))$. In our example, the right hand side yields `z = 5`, but the left hand side yields `z = NAC`, so we're nondistributive.

# Partial-redundancy elimination

If an expression `x + y` gets used throughout our flow graph, can we reduce the number of times it's uniquely evaluated? This covers common subexpressions, and loop invariant code motion, and partial-redundancy elimination.

> [!example]- An example of partial-redundancy elimination
> ![[Screenshot 2024-07-22 at 1.15.32 PM.png]]

We can't eliminate all redundant computations unless we can change the flow graph by creating new blocks. Our redundancy-elimination techniques should be able to introduce new blocks, but don't duplicate parts of the control flow graph, since the number of paths is exponential in the number of conditional branches in the program.

## The lazy-code-motion problem

We want programs optimized with partial-redundancy-elim to have the following properties:

- Redundant expressions are eliminated
- No extra computation not in original program
- Expressions computed at latest possible time—important for not using more register space than is needed!

The last point is what makes this *lazy*.

We define two kinds of redundancy:

- An expr $e$ in a block $B$ is **fully redundant** if, along all paths reaching $B$, $e$ has been evaluated and its operands haven't been subsequently redefined.
 	- Let $S$ be the set of blocks containing $e$ that renders $e$ in $B$ redundant.
 	- The edges leaving the blocks in $S$ forms a *cutset* which, when removed, disconnects $B$ from entry.
 	- No operands of $e$ are redefined along paths from blocks of $S$ to $B$.
- If $e$ is partially redundant, our algorithm introduces new copies of the expressions to make it fully redundant.

> [!note] What's a cutset again
> If we partition a graph into two sets of nodes $(S, T)$, a **cutset** is the set of edges where one endpoint is in $S$ and the other is in $T$.

## Anticipation of expressions

We only want to place copies of expressions at program points where the expression is **anticipated** (i.e., *very busy*): if all paths leading from that point eventually compute $b + c$ with the values of $b$ and $c$ available at that point. If there exists a execution path from this point that doesn't use $e$, it's not anticipated at this point.

Anticipation is the backwards analog to availability. Availability asks: "from all paths from start to here, is `x + y` used, and used with current `x` and `y`?" Anticipation asks: "from here to the end, is `x + y` with current `x` and `y` always computed?"

We do this to avoid spurious computation of an expression where it isn't used.

## The lazy-code-motion algorithm

Our algorithm has four steps:

1. Find all expressions anticipated at each program point with backwards dataflow.
2. Place copies of expressions as early as possible. We place them where they are anticipated—used as-is along every path going forward—but not *available*—if it's anticipated along all paths before reaching that point. ==This is a different definition for availability than what we described above!!==
3. Postpone expressions where possible—if it's anticipated but hasn't been used along any path reaching the program point.
4. Eliminate assignments to temporary variables that are only used once, using backward dataflow.

Let's first describe the intuition for these parts.

### Preprocessing

We assume every statement has its own basic block, and we only introduce new computations at the beginnings of basic blocks. If a destination of an edge has more than one predecessor, we insert a new block between the source and destination of that edge.

> [!note]- Why introduce new blocks?
> Consider the following example:
>
> ![[Screenshot 2024-07-22 at 4.07.17 PM.png]]
>
> Here, introducing `b + c` in $B_{3}$ would result in unneeded computation if we go to $B_{5}$. Instead, we need to introduce an intermediate block between $B_{3}$ and $B_{4}$, so that if we go that direction, only then do we compute `b + c`. A *critical edge* is an edge from a node with more than one successor to a node with more than one predecessor. Critical edges are where we need to introduce additional nodes.

### Anticipated expressions

For each expression, we find where that expression is anticipated—if that expression with its present value is used along all paths going forward from this program point.

![[Screenshot 2024-07-22 at 1.41.54 PM.png]]

When we say "anticipated or available *at* a block," we mean "anticipated or available *on entry* to the block."

The expression isn't anticipated in $B_{2}$ since `c` is redefined in $B_{2}$; the value of `b + c` at the start of $B_{2}$ isn't used after $B_{2}$. `b + c` isn't anticipated in $B_{1}$ since it's unnecessary once `c` is redefined in $B_{2}$, which execution may go through. Same for $B_{8}$; `b + c` might never be used again if we go straight to $B_{11}$.

The transfer function is as follows:
$$
f_{B}(x) = use_{B} \cup (x - kill_{B})
$$

Where $use_{B}$ is all expressions referenced in this block, and $kill_{B}$ is all expressions whose operands were defined in this block. Meet is set intersection ("all" paths), and since this is backwards, we define: $$ \begin{aligned}
\mathrm{IN}[B] &= f_{B}(\mathrm{OUT}[B]) \\
\mathrm{OUT}[B] &= \land_{S, succ(B)} \mathrm{IN}[S] \\
\end{aligned} $$

### Available expressions

Our algorithm also relies on what expressions are (not) available at each program point. Again, by available, we mean "is anticipated in all paths *before* this program point." Specifically, an expression is available on exit if:

- It's either
 	- available on entry, or
 	- In the set of anticipated expressions on entry—it *could* be made available if it was computed here
- and not killed in the block—none of its operands are defined in this block.

Formally, we note this in the transfer function:
$$
f_{B}(x) = (anticipated[B].in \cup x) - kill_{B}
$$
Meet here is set intersection as well—all paths. With this **forward** analysis, we can define the set of expressions that should be placed at block $B$: the set of anticipated expressions that are not yet available:
$$
earliest[B] = anticipated[B].in - available[B].in
$$
In this case, $b + c \in earliest[B_{3}]$ and $b + c \in earliest[B_{5}]$

### Postponable expressions

An expression is postponable to $p$ if an early placement of $e$ is encountered along every path from entry to $p$, and there isn't any use of $e$ after the last placement.

For instance, we can postpone $B_{3}$ to $B_{4}$, since there's no use of the expression after $B_{3}$. But we can't postpone it to $B_{7}$, since there's a use at $B_{7}$; doing this would cause a double-computation if we follow the path $B_{1}, B_{5}, B_{6}, B_{7}$. We also can't postpone the expression from $B_{5}$ to $B_{6}$, since it's used at $B_{5}$.

We add expressions that we've seen were in $earliest[B]$, but remove them once they appear in $use_{B}$. This is a forward analysis:
$$
f_{B}(x) = (earliest[B] \cup x) - use_{B}
$$
Meet is set intersection again. It's only postponable at this block if it's postponable at all previous blocks.

An expression is placed at the *frontier* where an expression goes from being postponable to not being postponable. The expressions where this is true for a block $B$ is given by $latest[B]$. $e$ can be placed at the start of $B$ only if it's in $B$'s *earliest* or *postponable* set upon entry.

> [!note]
> Remember that postponable isn't always a superset of earliest! For instance, for `b + c`, $B_{5}$ is earliest, but not postponable, since it also uses `b + c`.

Additionally, $B$ is in the postponement frontier of $e$ if one of the following holds:

- $e$ isn't in $postponable[B].out$—$e$ is in $use_{B}$. This means we should place the expression before the use in this block.
- $e$ can't be postponed to one of its successors; there exists a successor of $B$ such that $e$ isn't in the *earliest* or *postponable* set upon entry to that successor.

For our example, the latest placements of `b + c` are $B_{4}$ and $B_{5}$:

- `b + c` is in *postponable* of $B_{4}$ but not $B_{7}$ because it's used there.
- $B_{5}$'s earliest set includes `b + c`, and it uses `b + c`.

### Used expressions

Finally, we do a backward pass to see if any temporary variables are used beyond the block they're in. We're doing liveness analysis for expressions basically—an expression is *used* at point $p$ if there's a path from $p$ that uses the expression before it's reevaluated. This is backwards analysis.

Since an expression $e$ is defined at $B$ if it's in $latest[B]$, our backwards analysis includes expressions that are used in this block, but removes them if they're defined in this block—are in $latest[B]$:
$$
f_{B}(x) = (use_{B} \cup x) - latest[B]
$$

This meet is union.

### Putting it all together

For every expression in the program, do the following:

- Create a new temporary $t$ for $x + y$.
- For all blocks $B$ where $x + y \in latest[B] \cap used [B].out$, add `t = x + y` at the start of $B$.
 	- $latest[B]$ means it's definable in this block, $used [B].out$ means it's live and used later on.
- For all blocks $B$ where $x + y \in use_{B} \cap (\neg latest[B] \cup used [B].out)$, replace `x + y` with `t`.
 	- The expression is mentioned, and it's either not where an expression is defined, or it's where a variable is live.

# Dealing with loops

We need some new terminology and concepts to deal with loops in our CFGs.

## Dominators

A node $d$ **dominates** node $n$, written $d \operatorname{dom} n$, if every path from entry to $n$ goes through $d$. We can build a *dominator tree*, where the entry node is the root, and each node $d$ immediately dominates only its descendants. Every node $n$ has a unique *immediate dominator* $m$ that is the last dominator of $n$ on any path from entry to $n$. In other words:
$$
d \neq n \land d \operatorname{dom} n \implies d \operatorname{dom} m
$$
We can find dominators with a forward dataflow problem:

|                   | Dominators                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Domain            | The power set of $N$, all nodes                                                                                                        |
| Direction         | Forwards                                                                                                                               |
| Transfer function | $f_{B}(x) = x \cup \{ B \}$                                                                                                            |
| Boundary          | $\mathrm{OUT}[ENTRY] = \{ ENTRY \}$                                                                                                    |
| Meet              | $\land = \cap$                                                                                                                         |
| Equations         |
$$
\begin{aligned} \mathrm{OUT}[B] &= f_{B}(\mathrm{IN}[B]) \\ \mathrm{IN}[B] &= \land_{P,pred(B)} \mathrm{OUT}[P] \\ \end{aligned}
$$ |
| Initialization    | $\mathrm{OUT}[B] = N$                                                                                                                  |

Note that by this definition, a node dominates itself.

Additionally, we have a notion of a *dominance frontier*:
![[appelSSAFunctionalProgramming1998#^0ugvw5]]

## Depth-first ordering

A depth-first search of a CFG visits all the nodes in the graph once, starting at the entry node and visiting the nodes as far away from entry as quickly as possible. This route forms a *depth-first spanning tree* (DFST), where a node $m$ is a child of node $n$ if $m$ is visited through $n$.

> [!note]- See also
> ![[Screenshot 2024-07-23 at 8.04.12 PM.png]]

A *preorder traversal* visits a node before its children, left-to-right. A *postorder traversal* visits a node's children, left-to-right, before visiting itself. ^121596

A **depth-first ordering** is the reverse of a postorder traversal: visit a node, then its children right-to-left.

The algorithm for building a depth-first ordering and a DFST is as follows:

```
c = total number of nodes

search(n):
 mark n visited
 for successor s in n:
  if s is unvisited:
   add edge n -> s to DFST
   search(s)
   
 dfn[n] = c
 c = c - 1

search(entry)
```

where `dfn[n]` gives the index of the node in a depth-first ordering.

## Edges

An edge $A \to B$ of a CFG can be categorized based on the relationship of the nodes in a DFST:

- An **advancing edge** is where $B$ is a proper descendant of $A$ in the DFST. All the edges in the DFST are advancing.
- A **retreating edge** is where $B$ is an ancestor of $A$. In these cases, $dfn[B] \geq dfn[A]$.
- A **cross edge** is where neither are true. If we draw a DFST in the order children are added to the tree left-to-right, cross edges travel right to left.

A **back edge** is an edge $A \to B$ where $B$ dominates $A$. Every back edge is retreating, but not every retreating edge is a back edge. A graph is **reducible** if all its retreating edges are back edges. Alternatively, a graph is reducible if no matter the DFST, the set of retreating edges is the same, and equals the set of back edges.

For an example of a non-reducible CFG:

![[Screenshot 2024-07-23 at 8.30.04 PM.png]]

Here, depending on how we build the DFST, we could get different retreating edges. With the DFST `1 -> 2 -> 3`, the edge `3 -> 2` in the CFG is a retreating (but not back) edge. With the DFST `1 -> 3 -> 2`, the edge `2 -> 3` in the CFG is that edge.

## Depth of a flow graph

The **depth** of a graph with respect to a DFST is the largest number of retreating edges on any cycle-free path.

## Natural loops

A *natural loop* is a loop that is well-suited for easy optimization. It has two properties:

1. It must have a single-entry node, called the *header*. This dominates all nodes in the loop.
2. There must be a back edge that enters the loop header.

Given a back edge $n \to d$ *natural loop of the edge* is $d$ plus the set of nodes that can reach $n$ without going through $d$. $d$ is the header of the loop. To find the nodes in the natural loop from a back edge, do a depth-first search on *reverse* control-flow graph starting with $n$, adding all nodes visited to the loop. We mark $d$ as visited so search doesn't go beyond there.

With this, we can identify distinct loops. If two loops have the same header, we consider them the same loop.

## Speed of convergence of iterative data-flow algorithms

The maximum number of iterations the algorithm may take is the product of the height of the lattice and the number of nodes in the flow graph (for each node, we can move one step lower towards $\bot$). However, for many analyses, we can order the evaluation so that this converges way quicker.

The key thing that determines this: ==will all events of significance to a node be propagated *to* that node along some acyclic path, after one pass?==

- Yes with reaching. If a definition $d$ reaches $B$, there's some path from block containing $d$ to $B$ where $d$ is in all analyses on this path.
- Yes with availability. If $x + y$ isn't available, there's an acylic path where $x + y$ either is never generated, or is killed but isn't generated.
- Yes with liveness. If $x$ is live on exit from $B$, there's some acyclic path from $B$ to $x$ where $x$ isn't defined.

But not with constant propagation!

```
L: a = b
   b = c
   c = 1
   goto L
```

Here, it takes three loops to get a constant value for `a`.

In general, we want to modify our algorithm such that for forward flow problems, we move in depth-first order, while for backward problems, we move in reverse order. In this way, the ==number of passes needed to propagate any definition along any acyclic path is no more than the depth plus two.== This is because we can propagate all needed info forward as long as an edge isn't retreating; if it's retreating, we have to repropagate back down the depth order. We need at least one pass to propagate information, hence the first plus one, and we need an extra pass to check that nothing has changed, hence the second plus one.
