---
aliases:
  - code generation
---
> [!see also]
> Stanford's CS 143 [lecture slides](https://web.stanford.edu/class/archive/cs/cs143/cs143.1128/lectures/17/Slides17.pdf)

Register allocation is part of **code generation**: converting IR into assembly or machine code. The question is: how can we place our objects to *take the best advantage of the memory hierarchy*?

> [!note]
> Note that [[wilsonUniprocessorGarbageCollection1992|garbage collection]] is often also included with code generation.

![[Screenshot 2024-08-21 at 6.28.18 PM.png]]

**Register allocation** is the process of assigning variables to registers and managing data transfer in and out of registers. These registers are limited and *complicated*: registers are made of subregisters, can't use some at the same time, some results need to go in specific places.

# How to do it

There are three broad approaches:

- **Naïve (no) register allocation**: store everything in RAM. Whenever you need a variables for an operation, load variables, perform op, store.
- **Linear scan register allocation**: use live intervals to greedily assign variables to registers.
	- Used for JIT compilers due to efficiency.
- **Graph-coloring register allocation**.
	- Used in heavy-duty compilers, e.g., GCC

## Naïve

`a = b + c` becomes load `b`, load `c`, add, store result. Hella slow, but easy n simple!

## Linear scan

A variable is **[[ahoDragonBookMachineindependent2007#Liveness analysis|live]]** at a program point if its value may be read later before it's written. The **live range** of a variable is the set of program points where it's live. The **live interval** of a variable is the smallest subrange of *IR code* covering all its live ranges.

We do a linear scan through the live intervals of our different variables from start to finish and allocate greedily. If two intervals don't overlap, we can allocate them in the same register no problem. If they do, we may need to do **register spilling**, storing onto main memory.

## Graph coloring

A **register interference graph** is a [[ahoDragonBookBasic2007|control-flow graph]] where every node is a variable, and edges connect variables that are *live at the same program point*. Register allocation then becomes assigning each variable a different register than that of its connected neighbors.

This is the **graph-coloring** problem! We want to color the graph such that no two adjacent vertices have the same color; a **vertex coloring**. For more than 3 variables, this is NP-complete.

### Chaitin's algorithm

So how could we go about this? Well, let's say you're trying to do a vertex coloring of a graph with $k$ colors. If you see a node with fewer than $k$ edges, we can remove it from the graph, color the rest, and then add it back; there must be *some* color available for this node since it has fewer than $k$ edges, and what color that is can be determined after we've colored the rest of the graph!

This is the algorithm. If we can't find a node with fewer than $k$ edges, we mark that node troublesome and note that it might be spilled. We can use heuristics to find the best choice of this. We can also recompute the RIG when a variable is spilled, using a new coloring to find a register.
