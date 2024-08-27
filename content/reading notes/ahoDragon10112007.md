---
aliases:
  - "Dragon Book 10, 11: Parallelism"
  - polyhedral analysis
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
scheduled: 2024-08-11
---
# §10. Instruction-level parallelism

> [!note] See also
> <https://en.wikipedia.org/wiki/Automatic_parallelization>

This section has to do with achieving parallelism *within a single CPU core*.

ILP is executing multiple CPU instructions in parallel. ILP is in contrast to concurrency—switching between threads when one is blocked on e.g., I/O. We can do dynamic hardware ILP—the processor decides on-the-fly what to run in parallel—or static software ILP—the compiler figures out where parallelism can happen.

In this section, we'll go through some techniques for doing ILP.

## Processing architectures & pipelining

A CPU can issue one operation per clock, and still execute multiple instructions at the same time! CPUs have an instruction pipeline: fetch the instruction (IF), decoding it (ID), executing the operation (EX), getting memory (MEM), and writing the result (WB). We can execute multiple instructions at the same time as long as they're in different operations:

![[Screenshot 2024-08-11 at 2.25.11 PM.png]]

Execution of an instruction is *pipelined* if succeeding instructions not dependent on the result are allowed to proceed; if we can do the staggering shown above. We can't do this in e.g., branching, since we need to fully execute an instruction before knowing which instr is executed next.

The maximum number of *in-flight* ops at once is length of instruction pipeline multiplied by number of operations the processor can issue simultaneously.

Very-Long-Instruction-Word (VLIW) machines rely on software parallelism, encoding what to execute in parallel in very long instructions! Superscalar machines automatically detect instruction dependences and execute things in parallel.

## Code scheduling

Code scheduling is a [[2024-07-10 • optimizations and gc|program optimization]] where we execute code out of order to maximize instruction-level parallelism, data locality, and resource use. Code scheduling must respect data dependences, control dependences, and **resource constraints** (can't overuse machine resources).

When talking about data dependences (see [[ferranteProgramDependenceGraph1987|The program dependence graph and its use in optimization]]), normally we're only concerned with true dependences (read after write). However, with antidependence (write after read) and output dependence (write after write), we need to preserve order there too. ^h2y8li

Some extra notes:

- Array data-dependence analysis (often just called data-dependence analysis), where we figure out dependences within array indices, is very important for numeric code.
- See also [[sridharanAliasAnalysisObjectOriented2013|Pointer-alias analysis]] and interprocedural analysis
- ILP encourages using as many registers as possible to reduce data dependences. But generally we want to minimize number of registers used.
- We can do *speculative execution*, running an extra instruction in parallel if the resource is available, in case a branch is/n't taken.
 	- Prefetching instruction
 	- Poison bits: if illegal memory is accessed, only raise exception if it's *used*.
 	- Predicated execution: instructions that add extra predicate operand, only executed if predicate is true.

For each instruction, we associate it with a *resource-reservation table* $RT_{t}$. This table indicates what resources an instruction uses, and during which clocks. For example, if an instruction uses the ALU for all three clocks, then $RT_{t}[i, \mathbf{alu}] = 1$ for $i = 0, 1, 2$.

## Basic block scheduling

How can we schedule instructions in a basic block? Well, let's first create a data-dependence graph, where each node contains the resource-reservation table of the operation, and each edge is labeled with a delay $d_{e}$, indicating how long we have to wait before executing the next instruction along that path.

In **list scheduling**, we go in some *prioritized* topological order. We pick the earliest time slot each node can be executed such that the appropriate resources are available. This topological order can be chosen by a number of heuristics:

- Look at length of longest path in graph originating from node.
- Operations using more critical resources—highest uses-to-available ratio—can be prioritized
- Use source ordering to break ties; if it shows up earlier, it's executed first

## Global code scheduling

Now, let's try scheduling instructions across basic blocks. As mentioned above in [[#Code scheduling]], we do this to make better use of machine resources. We need to make sure we respect *control dependences* now too.

Let's say we want to move a block `src` to `dst`, doing some *code motion*! The extra things we need to do to make sure this is correct:

![[Screenshot 2024-08-11 at 3.13.50 PM.png]]

"speculation/code dup." means we'll need to execute extra code, which is fine if we can speculate. "compensation code" means we need extra copies of our operation, similar to our discussion about [[ahoDragonBookMachineindependent2007#Partial-redundancy elimination|partial redundancy elimination]].

After we move code, we need to adjust data dependences.

Since 10% of the code takes 90% of runtime, we should optimize this code, even if it makes the other code slower. Generally, this means innermost loops and *not* exception handlers. We can get more info with dynamic profiling.

### Region-based scheduling

This code scheduler lets us do the two easiest forms of code motion:

1. Move operations up to control-equivalent basic blocks
2. Move operations speculatively up one branch to a dominating predecessor

A *region* is a subset of the CFG that can be reached only through one entry block. It's like a [[ferranteProgramDependenceGraph1987#^0e12cf|hammock]], only we don't have any exit restrictions. Our region-based scheduling algorithm creates a schedule $S$ mapping each instruction to a basic block and a *time slot*.

We iterate through regions and basic blocks in prioritized topological order (inner regions first, basic blocks in dependence order). For each basic block, we also consider potential instructions that match the two qualifications above. We then iterate through each time step, going through instructions in priority order and scheduling them as soon as they're ready and have no resource conflicts, and adjusting our resource commitments and data dependences accordingly.

![[Screenshot 2024-08-11 at 3.46.32 PM.png]]

In this algorithm, operations from one iteration of a loop can't overlap with another. We can do *loop unrolling* to counter this.

> [!danger] TODO
> Other stuff in §10.4 I skipped.

## Software pipelining

> [!note] See also
> <https://en.wikipedia.org/wiki/Software_pipelining>

*Do-all* loops are loops where iterations are completely independent from one-another. It's common in APL-style code. **Software pipelining** schedules an entire loop (i.e., all of its iterations) all at once, taking advantage of parallelism *across iterations*.

Let's say we have the following code:

```c
for (i = 0; i < n; i++)
 D[i] = A[i]*B[i] + c;
```

We can pipeline our instructions (assuming `MUL` takes three cycles, everything else takes one):

![[Screenshot 2024-08-11 at 4.25.26 PM.png]]

Notice that we explicitly add a gap between `ADD` and `ST`ore. This is to maintain high throughput and to avoid resource conflicts. Lines 1-6 are the *prologue*, the first iterations where we fill the pipeline. At max, we can do four iterations at once. Then, lines 9-14 are the *epilogue*, where pipeline instructions are drained out. Loop unrolling can help with this.

Software pipelining is limited by two crucial factors:

1. Cycles in precedence constraints
2. Usage of critical resources.

# §11. Optimizing for parallelism and locality

This section has to do with *parallelism across multiple CPU cores*.

Maximizing parallelism also means maximizing **data locality**: minimizing the need for processes to communicate with each other. To implement this, we need more powerful analyses than [[ahoDragonBookMachineindependent2007|dataflow analysis]], since it doesn't distinguish between different executions of the same statement (e.g., in a loop).

In this chapter, they focus on *affine* array accesses, where the thing they're calculating can be expressed as a linear combination of variables (plus some constant).

As part of this, we need to know which iterations of a loop might refer to the same memory location, so we can build data dependences.

> The theory we present in this chapter is grounded in linear algebra and integer programming techniques. We model iterations in an n-deep loop nest as an n-dimensional polyhedron, whose boundaries are specified by the bounds of the loops in the code. Ane functions map each iteration to the array locations it accesses. We can use integer linear programming to determine if there exist two iterations that can refer to the same location

There are two code transformations: *affine partitioning* and *blocking*. Both operate on our polyhedron. The former exposes opportunities for parallelization, the latter subdivides our big multi-dimensional loop into *blocks* that we iterate over in turn, improving locality.

> [!note] SPMD
> Throughout this chapter the book uses the term **SPMD**: single program, multiple data. Basically, multiple processors cooperate to simultaneously execute the same program at independent points (e.g., different for loop iterations). In SIMD, this isn't the case.
>
> See <https://en.wikipedia.org/wiki/Single_program,_multiple_data> also.

## On parallelism

![[Screenshot 2024-08-12 at 4.43.40 PM.png]]

Distributed memory has hierarchical memory all the way down. Symmetric multiprocessors share memory at lowest level.

To estimate parallelizable code, we measure **parallelism coverage** (% of computation in parallel) and **granularity of parallelism** (amount of parallel execution before sync is needed).

> [!note] Amdahl's Law
> If $f$ is the fraction of the code parallelized, and it's run on $p$-processor machine with no communication or overhead, speedup is
$$
\frac{1}{(1 - f) + (f / p)}
$$

Normally, we can get lots of parallelism out of loops. A *kernel* is the core computation of a program, which may involves lots of nested loops!

When we discuss locality, there can be **temporal** and **spatial** locality. Spatial locality is important for minding cache lines.

## Affine transform theory

At a high level, *affine transform theory* involves expressing loops in terms of linear algebra—matrices, vectors, etc. Once we do this, we can express properties about our loops—spatial/temporal reuse, etc.—in terms of mathematical properties on the matrices. Additionally, optimization also becomes linear algebra.

When considering the problem of optimizing loops with array accesses, we formulate the problem in terms of *multidimensional spaces* and *affine mappings between these spaces*. In particular, we consider three spaces:

- The *iteration space*, the set of combinations of values taken on by the loop indices.
 	- For $d$ nested loops, we have a $d$-dimensional space
- The *data space*, the set of array elements accessed
 	- e.g., array index $1, \dots, 99$
 	- $n$-dimensional arrays are treated as such.
 	- We calculate the index via an *affine array-index function*, an affine function operating on a set of loop indices.
- The *processor space*, the set of processors in the system.
 	- Before parallelization, we assume we have infinite virtual processors.
 	- Organize them in a multidimensional space, one dimension for each loop in the nest we want to parallelize.
 	- Block them together to map them to physical processors.

This kind of analysis is also called **polyhedral analysis**, since each space corresponds to some polyhedron with the appropriate amount of dimensions for each space.

Once we have these spaces, we perform an *affine partitioning*, using an affine function to assign iterations in an iteration space to processors in the processor space. To aid this partitioning, we can calculate the region of data accessed by an iteration by combining iteration space info with the array index function. This also must take data dependences into account.

### Iteration spaces

How do we represent these nested loops as a mathematical set?

```c
for (int i = 0; i <= 5; i++)
 for (int j = i; j <= 7; j++)
  Z[j, i] = 0;
```

In general, an iteration space can be represented as:
$$
\{ \vec{i} \in \mathbb{Z}^d \mid \mathbf{B}\vec{i} + \vec{b} \geq \mathbf{0} \}
$$
where $\mathbf{B}$ is some $d \times d$ matrix and $\vec{b}$ is an integer vector of length $d$. Each selection of constraints for $i$ and $j$ results in different values for $\mathbf{B}$ and $\vec{b}$. For the 2D case, we need four constraints of the form $ui + vj + w \geq 0$; $[u, v]$ is a row in $\mathbf{B}$ and $w$ is a row in $\vec{b}$. We can get these four constraints from the four constraints imposed by our loops: each of the starting and ending values of $i$ and $j$.

What if we wanted to iterate through this space using $j$ first? Well, this set represents some $d$-dimensional polyhedron, consisting of some points $(i_{k}, j_{k})$. If we *project* this shape, we can fix $j_{k}$ and re-express $i_k$ in terms of $j$. ^0c2e21

> [!danger] TODO
> I'm skipping over a bunch of shit here.

We can change axes by creating new loop index variables that perform affine combos of original variables. We can also compute **tight loop bounds** for our variables with this polyhedron. This will become relevant later.

### Affine accesses

An **affine array access function** maps a vector $\vec{i}$ in the bounds $\mathbf{B}\vec{i} + \vec{b} \geq \vec{0}$ to the array element location $\mathbf{F}\vec{i} + \vec{f}$.

Sparse matrix representations that require multiple chained lookups (e.g., `X[Y[i]]`) aren't affine. Linearized arrays, where multidimensional objects are collapsed into a single dimensional array, also aren't affine (e.g., `Z[i * n + j]` is quadratic).

### Data reuse

There are a few kinds of reuses: *self* (iterations reusing data come from same static access, e.g., `Z[j + 1] = Z[j] + Z[j + 2]`) vs *group*, *temporal* (exact same location is referenced over time), *spatial* (same cache line is reference). We can use linear algebra to get reuse info from our affine array acceses.

The *rank* of $\mathbf{F}$—the number of linearly independent rows—tells us the dimension of our array access. Two iterations refer to the same array element if the difference of their loop index vectors is in the null space of $\mathbf{F}$:
$$
\mathbf{F}(\vec{i} - \vec{i'}) = \vec{0}
$$
To discover spatial reuse, drop the last row of $\mathbf{F}$; if the rank of the new matrix is less than loop nest depth, there's opportunity for spatial locality. Group reuse requires that:
$$
\mathbf{F}\vec{i_{1}} + \vec{f_{1}} = \mathbf{F}\vec{i_{2}} + \vec{f_{2}}
$$

### Array data-dependence analysis

We solve the following equation with ILP:
$$
\mathbf{F}_{1} \vec{i_{1}} + \vec{f_{1}} = \mathbf{F_{2}} \vec{i_{2}} + \vec{f_{2}}
$$
We can use Diophantine equations as a heuristic to see if we need to throw ILP at the problem. An equation $a_{1}x_{1} + \cdots + a_{n}x_{n} = c$ has a solution iff $c \bmod gcd(a_{i}) \equiv 0$.

## Finding sync-less, space-partitioning parallelism

Okay, we have all this math. What can we do with this?

Let's say we have a loop nest with $k$ degrees of parallelism—$k$ loops with no data dependencies between different iterations of the loops. Initially, we assume each dimension of our processor array has as many processors as there are iterations of the corresponding loop. Thus, we can create an *affine space partition*, mapping each dynamic instance of a statement of our program to a processor ID.

To require no communication between processes, anything with a data dependence has to be assigned to the same processor. These are *space-partition constraints*. A space partition is also a matrix $\mathbf{C}$ and a vector $\vec{c}$ that act on a loop iteration. We want to choose partitions that maximize parallelism: the *rank* of $\mathbf{C}$.

For each statement, we create one partition. For every two statements $s_{1}$ and $s_{2}$ that have accesses sharing a dependence, the following **space-partition constraint** must hold:
$$
\mathbf{F_{1}} \vec{i_{1}} + \vec{f_{1}} = \mathbf{F_{2}}\vec{i_{2}} + f_{2} \implies \mathbf{C_{1}} \vec{i_{1}} + \vec{c_{1}} = \mathbf{C_{2}} \vec{i_{2}} + \vec{c_{2}}
$$
That is, if they access the same item, they must map to the same processor.

> [!example]
> For this loop nest:
>
> ![[Screenshot 2024-08-13 at 2.59.28 PM.png]]
>
> we have these constraints:
>
> ![[Screenshot 2024-08-13 at 2.59.50 PM.png]]

The high-level overview of the algorithm is:

> [!important] Algorithm for space-partitioning for simple sync-less parallelization
>
> - Find all data-dependences and create constraints
> - Use Gaussian elimination to reduce the number of variables
> - Drop nonpartition variables
> - Find rank of affine partition and solve for coefficient matrices
> - Find constant terms

### Generating actual code

Now, we have our iterations in terms of virtual processors. Codegen proceeds in a few steps.

- **Naïve codegen**. Loop over processor indices. Write loop indices in terms of processor indices.
- **Tighten loop bounds**.
- **Remove unnecessary conditionals**.

Affine partitions map to the following loop operations:

- **Fusion**. Mapping multiple loop indices in the original program to the same index combines separate loops into a single loop with a longer body. ^ybh9ii
- **Fission**. The reverse of fusion.
- **Re-indexing**. Shifting dynamic executions of a statement by constant number of iterations. Affine transform has constant term.
- **Scaling**. Space apart iterations by constant factor. Affine transform has positive non-1 coefficient.
- **Reversal**.
- **Permutation**: Swap order of nested loops. $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$.
- **Skewing**: "Iterate through the iteration space in the loops at an angle. The ane transform is a unimodular matrix with 1's on the diagonal." $\begin{bmatrix} 1 & -1 \\ 0 & 1 \end{bmatrix} \begin{bmatrix} i \\ j \end{bmatrix} + \begin{bmatrix} 0 \\ 1\end{bmatrix}$

## Synchronization between parallel loops

We can use **loop fission** to break up loops and introduce opportunities for parallelism. For instance:

```c
for (i=1; i<=n; i++) {
 X[i] = Y[i] + Z[i]; /* (s1) */
 W[A[i]] = X[i]; /* (s2) */
}
```

In this code, `s1` is parallelizable but `s2` isn't, since we have no idea what items will be accessed in `W`. In this case, we can split up this code into two different loops:

```c
for (i=1; i<=n; i++) {
 X[i] = Y[i] + Z[i]; /* (s1) */
}

for (i=1; i<=n; i++) {
 W[A[i]] = X[i]; /* (s2) */
}
```

Now we can parallelize loop 1, but not loop 2.

To figure out where we can do loop fission, we look at a [[ferranteProgramDependenceGraph1987|program dependence graph]]. If $s_{2}$ is dependent on $s_{1}$ but not the other way around (i.e., there is an edge $s_{1} \to s_{2}$ but not $s_{2} \to s_{1}$), we can split $s_{1}$ and $s_{2}$ into different loops.

The algorithm is as follows:

> [!important] Algorithm for simple parallelization with synchronization
>
> 1. Create the PDG and partition nodes into **strongly connected components** (SCCs): the maximal subgraph of the original where every node in the subgraph can reach every other node.
> 2. Within each SCC, do as much loop fission as possible in topological order.
> 3. Apply the algorithm from the previous section on each SCC. Insert sync barriers before and after each parallelized SCC.

This is a start, but can be too over-eager in introducing syncing.

## Pipelining

Pipelining is an alternate means of distributing loop iterations across different CPUs.

> [!warning] Disambiguation
> There is hardware pipelining—pipelining at the sub-instruction/operation level—and software pipelining—pipelining within a single CPU at the instruction level. This is a *different* kind of pipelining, where now we pipeline across different CPUs.

Consider this loop that sums the `i`th row of `Y` and adds it to `X[i]`:

```c
for (i = 1;`i <= m; i++)
 for (j = 1; j <= n; j++)
  X[i] = X[i] + Y[i,j];
```

There are two ways of parallelizing this loop. As we've seen before, in simple parallelism, we can assign different processors for different values of `i`. However, we can also **pipeline** execution like so:

![[Screenshot 2024-08-13 at 3.40.43 PM.png]]

Here, every processor touches every row of `X` and `Y`, but they do so at different times, allowing for overlapping execution. We treat the outer loop as tasks, and the inner loop as stages of our task. We can stagger stages. Key differences between pipelining and simple parallelism:

- Pipelining only works with nested loops.
- Tasks executed on a pipeline may share dependencies.
- Pipelining may be better than simple parallelization when the cost of filling and draining the pipeline is less than the potential communication savings.

### Pipelining in-depth

A nest is **fully permutable** if the loops can be permuted arbitrarily (modulo adjusting the upper bounds in the code) without changing the semantics of the original program. This loop, for instance, is *not* fully permutable:

```c
for (i = 0; i <= m; i++)
 for (j = 0; j <= n; j++)
  X[j+1] = 1/3 * (X[j] + X[j+1] + X[j+2])
```

Even though changing the order is still valid, it would change the semantics of our program. We're iterating in column- instead of row-order. By contrast, this loop:

```c
for (i = 0; i <= m; i++)
 for (j = i; j <= i+n; j++)
  X[j-i+1] = 1/3 * (X[j-i] + X[j-i+1] + X[j-i+2])
```

is semantically equivalent to:

```c
for (j = 0; j <= m+n; j++)
 for (i = max(0,j); i <= min(m,j), i++)
  X[j-i+1] = 1/3 * (X[j-i] + X[j-i+1] + X[j-i+2])
```

Formally, time-partition constraints are more relaxed than space-partition constraints. For a statement $s_{1}$ and $s_{2}$, where $s_{2}$ is data-dependent on $s_{1}$, the following must hold:
$$
\mathbf{F_{1}} \vec{i_{1}} + \vec{f_{1}} = \mathbf{F_{2}}\vec{i_{2}} + f_{2} \implies \mathbf{C_{1}} \vec{i_{1}} + \vec{c_{1}} \leq \mathbf{C_{2}} \vec{i_{2}} + \vec{c_{2}}
$$
Here, we only require that execution order is preserved.

> [!important] Algorithm to solve these constraints
> To solve these constraints, we use Farkas' Lemma, which lets us find a vector $\vec{c}$ such that $\mathbf{A}\vec{x} \geq \vec{0} \implies \vec{c}^T \vec{x} \geq 0$.

If this has $k$ independent solutions, we can create a loop nest with $k$ outermost fully permutable loops by making the $k$th solution the $k$the row of our affine transform matrix. (Note that there are $k!$ valid possible transformations in total).

There's some other stuff we can do too:

- **Wavefronting**. If we have $k$ outermost fully permutable loops, we can generate $k - 1$ inner parallelizable loops. We create a new index variable $i'$ that combines the indices in the outer $k$-depth nest. This combination can be e.g., sum. Then, if iterate through $i'$ in sequential order, the first $k - 1$ loops within each partition are guaranteed to be parallelizable. We're basically moving diagonally along our iteration space! Iterations within iterations of the $i'$ loop have no data dependence.
 	- Apparently pipelining is still better tho
- **Blocking**. As mentioned before, blocking is subdividing our iteration space for the sake of locality and reducing sync. We can assign processors to blocks.

We can roll all this together to produce an **algorithm for finding parallelism with minimum synchronization**:

> [!important] Algorithm for parallelism with minimum synchronization
>
> 1. Use algorithm from [[#Finding sync-less, space-partitioning parallelism]] to find maximum parallelism requiring no synchronization.
> 2. Within each space partition from the above step, use algorithm from [[#Synchronization between parallel loops]] to find maximum degree of parallelism with $O(1)$ synchronizations.
> 3. Within each partition above, use this algorithm to find pipelined parallelism, then apply the [[#Synchronization between parallel loops]] algorithm to each partition assigned to each processor, or the body of the sequential loop if no pipelining is found. This finds parallelism with $O(n)$ synchronizations.
> 4. Recursively apply step 3 to computation belonging to each space partition generated by previous step, finding maximum degree of parallelism with successively greater degrees of sync.

## Locality optimizations

There are three main techniques for improving data locality:

1. **Improving temporal locality** by using results as soon as they're generated. We divide computation into independent partitions and execute dependent operations close together.
2. **Array contraction** reduces array dimensions and number of memory locations accessed. We do this if only one location of the array is used at a time.
3. **Optimize for spatial locality of computer results** by interleaving partitions so reuses among partitions occur close together.

With array contraction, if we can use local variables and lower-dimension variables instead, that tends to help! However, this does reduce potential parallelism.

To accomplish interleaving, we can use *blocking* to introduce temporal locality, so that results are reused shortly after they're generated. Specifically, there are two kinds of transformations. If an outer parallelizable loop has an inner loop, and there's reuse across the outer loop, we can block on the outer loop:

```c
for (i = 0; i < n; i++)
 for (j = 0; j < n; j++)
  todo();

// into

for (ii = 0; i < n; ii += 4)
 for (j = 0; j < n; j++)
  for (i = ii; i < min(n, ii + 4); i++)
   todo();
```

This is called **stripmining**. Alternatively, if we have a loop with multiple statements, which might be loops themselves, we can distribute stripmining across these statements so that within each substatement/loop, reuse happens sooner:

```c
for (i = 0; i < n; i++) {
 // s1
 // s2
}

// into

for (ii = 0; i < n; ii += 4) {
 for (i = ii; i < min(n, ii + 4), i++)
  // s1

 for (i = ii; i < min(n, ii + 4), i++)
  // s2
}
```

## Optimizing everything

With these pieces in place, we can do the **full algorithm for parallelization and locality optimization!**

> [!important] The Big Algorithm
>
> 1. Introduce parallelism and optimize temporal locality of results with the full algorithm from [[#Pipelining]]
> 2. Contract arrays where possible.
> 3. Determine iteration subspace that might share data or cache lines with technique from [[#Data reuse]].
> 4. Block innermost fully permutable loop nest with reuse, and block outer fully permutable loop nest for higher levels of memory, e.g., L3 cache
> 5. Expand scalars and arrays where necessary to reintroduce parallelism.

## Other uses for affine transforms

- **Optimizing for distributed memory machines**. If you can only communicate with other machines by sending messages, processors need big independent units of compilation, which you can get with [[#Finding sync-less, space-partitioning parallelism]]
 	- Also have to deal with generating communication code (in or out of sync points? how often?), allocating the right amount of memory (via [[#^0c2e21|projection]])
 	- Embedded systems with coprocessors, etc.
- **Multi-instruction-issue processors**. How can we facilitate [[#Software pipelining]] with these techniques?
 	- > "As discussed in Section 10.5, the performance of a software-pipelined loop is limited by two factors: cycles in precedence constraints and the usage of the critical resource."
 	- Loop transforms can create innermost parallelizable loops, eliminating precedence cycles
 	- Improve usage balance of resource inside a loop.
  		- > "Suppose one loop only uses the adder, and another uses only the multiplier. Or, suppose one loop is memory bound and another is compute bound. It is desirable to fuse each pair of loops in these examples together so as to utilize all the functional units at the same time."
- **Vectorization and SIMD**. Lots of similarity with [[#Locality optimizations]], though also have to deal with alignment and needing to swizzle non-contiguous data.
- **Prefetching**. Using [[#Data reuse]] analysis to figure out when cache misses are likely.
