---
aliases:
  - Programming parallel algorithms
  - NESL
tags:
  - reading
year: 1996
authors:
  - Blelloch, Guy E.
status: Todo
source: https://dl.acm.org/doi/10.1145/227234.227246
related: 
itemType: journalArticle
journal: Commun. ACM
volume: 39
issue: 3
pages: 85–97
DOI: 10.1145/227234.227246
scheduled: 2024-08-19
---
From the [website](http://www.cs.cmu.edu/~scandal/nesl.html):

> The most important new ideas behind NESL are
>
> 1. **[Nested data parallelism:](http://www.cs.cmu.edu/~scandal/cacm/node4.html)** this feature offers the benefits of data parallelism, concise code that is easy to understand and debug, while being well suited for irregular algorithms, such as algorithms on trees, graphs or sparse matrices (see the examples above or in our [library of algorithms](http://www.cs.cmu.edu/~scandal/nesl/algorithms.html)).
> 2. **A language based performance model:** this gives a formal way to calculated the [**work** and **depth**](http://www.cs.cmu.edu/~scandal/cacm/node1.html) of a program. These measures can be related to running time on parallel machines.

# Nested data parallelism

They're mainly focused about being able to operate in parallel over collections. This is **data parallelism**.

Prior data-parallel languages were *flat* data-parallel languages, where functions that operate over collections must themselves be sequential. This paper introduces *nested* data-parallelism, where parallel functions can themselves be applied over a set of values. For example, to compute row matrix sums, we could run a function in parallel over the rows; that function itself could use divide-and-conquer to sum each row in parallel.

At the time, the prevalent parallel languages—High Performance Fortran (HPF) and [C*](https://en.wikipedia.org/wiki/C*)—didn't support this.

## NESL

The language they define, NESL, accomplishes data parallelism with list comprehensions basically, which they call *apply-to-each*:

```
{a * a : a in [3, -4, -9, 5]}
```

Nested data parallelism just comes from nesting these apply-to-each calls. We're looking at nested 1D arrays.

They also provide a function `write : [x] -> [(usize, x)] -> [x]`. It takes an array to modify, a list of `(index, value)` pairs, and writes `array[index] = value` for all apirs in parallel.

Under the hood, this does a *flattening* operation (what [[chakravartyDataParallelHaskell2007|DPH]] calls vectorization), transforming the nested program so that it operates on flat arrays. 

> [!note] Data parallelism today
> The Rust library **Rayon** is an example of nested data parallelism!

# The performance model

To accompany this, the paper also discusses different *models* for conceptualizing how a parallel program might perform. Similar to how C basically assumes this PDP-8 abstract machine, in parallel computing, we create an abstraction for the machine. At the time this paper was written, two of these models were:

- A **parallel random access machine (PRAM)**, where all CPUs can access memory locations in shared memory simultaneously in unit time.
- "Or through a network" - I'm not sure what this means

These are **virtual models**: they aren't actually representative of a real computer. The paper then describes performance of algorithms in terms of **work** and **depth**. Work is the total number of operations, depth is the longest chain of dependencies.

- *Circuit models*, where a program is a (cycle-less) circuit of logic gates. Work is number of gates, depth is longest path.
- *Vector machine models*, where a program consists of vector instructions. Work is number of instructions, depth is max sum of vector lengths.
- *Language-based models*, where work/depth are defined in terms of language constructs.

