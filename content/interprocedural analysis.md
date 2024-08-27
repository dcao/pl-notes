**Interprocedural analysis** concerns analyzing a program with multiple procedures, taking into account the way that information flows among these procedures. This contrasts with *intraprocedural analysis*, which concerns analyzig programs within a single procedure.

> [!note] See also
> This note combines multiple resources, including:
>
> - [Jonathan Aldrich's lecture notes](https://www.cs.cmu.edu/~aldrich/courses/15-819O-13sp/resources/interprocedural.pdf)
> - [Cornell's CS 6120 lecture](https://www.cs.cornell.edu/courses/cs6120/2020fa/lesson/8/)
> - [Harvard's CS252r SP11 lecture slides](https://groups.seas.harvard.edu/courses/cs252/2011sp/slides/Lec05-Interprocedural.pdf)

# Open vs. closed worlds

Interprocedural analyses need to assume the work in an **open world**: they don't see *all* the code that turns into the final program.

- **Separate compilation**: compiling `*.c` to `*.o` independently.
- **Speed**
- **Loading code at runtime**

But sometimes, you do get to assume a **closed world**. This is **whole-program analysis**.

- **Link-time optimization**: after all `*.o` files are linked together.
- **Just-in-time (JIT) compilers** see all code being run. Can temporarily assume closed-world, turn into open-world 

# Starting with call graphs

A **call graph** is a graph between functions as nodes, and edges for each instance of a function call. We could have multiple $f \to g$ edges!

> [!warning]
> For e.g., higher-order functional languages, this isn't trivial!

As a starting point for how we can do interprocedural analysis, we can just build a big CFG based on this call graph, where we build the CFG for each function, and then add edges where calls happen. There are a few wrinkles here:

- We have to deal with plumbing for arguments and return values.
- More importantly, this is **context-insensitive**: dataflow facts from one call sites affect results at other call sites!

# Inlining

We can use [[inlining]] to turn interprocedural optimization problems into intraprocedural optimization problems. This gives us context sensitivity, since every call site gets its own copy of the function, and lets us use all of our intraprocedural optimization tools in interprocedural contexts! Problems:

- **Exponential blowup of CFG**: `p() { q(); q(); }  q() { r(); r() }` etc.
- **Recursive procedures** and other cycles in call graph.

# Context-sensitivity

As Aldrich puts it:

> Context-sensitive analysis analyzes a function ... ==parametrically==, so that the analysis results returned to different call sites reflect the different analysis results passed in at those call sites.

See [[nielsonPrinciplesProgramAnalysis1999a#Context sensitivity k-CFAs and m-CFAs|control flow analysis and context-sensitive CFAs]] (e.g., $k$-CFAs, $m$-CFAs).

# Expressing as graph-reachability

Interprocedural analyses are especially amenable to being [[repsProgramAnalysisGraph1998|re-expressed as graph reachability problems]]. In particular, interprocedural analyses are amenable to being re-expressed as **context-free language (CFL) graph reachability problems**.

![[Screenshot 2024-08-25 at 12.25.27 AM.png]]

Benefits:

- CFL-reachability is $O(n^3)$ wrt nodes in graph
- Get faster, approximate solution for free: graph reachability
- **On demand** analysis algorithm for free

> [!danger] TODO
> More here I haven't looked at.