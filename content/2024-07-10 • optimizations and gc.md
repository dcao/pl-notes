---
aliases:
  - program optimization
---
Since this is a very general topic, this note serves both to track my readings for this week of prelim prep, but also as an index for resources on **program optimization** generally.

> [!note] See also
> This note borrows from [Wikipedia](https://en.wikipedia.org/wiki/Program_optimization).

# Static optimization

There are a number of techniques we can make use of to optimize. The Dragon book provides an example of a number of these:

![[ahoDragonBookMachineindependent2007#The principal sources of optimization|Dragon Book 9: Machine-independent optimization]]

- [/] [[ahoDragonBookMachineindependent2007|Dragon Book 9: Machine-independent optimization]] (also used for data flow analysis, CFG stuff)

I've taken notes on a few other things mentioned explicitly in the syllabus:

- [x] [[inlining]] ✅ 2024-07-24
- [x] [[value numbering]] ✅ 2024-07-24
- [x] [[2024-08-21 • auto-parallelization|auto-parallelization]] ✅ 2024-08-20
- [ ] % [[escape analysis]]
- [ ] % [[tail duplication]]

And I've noted a few other areas for optimization (from [here](https://docs.google.com/document/d/1_UtAxx-KBUjp53JYStSLf6hxQ61rt54uNYid4dM6lVA/edit#heading=h.j8dau1y96u93) and [also this extremely useful Wikipedia page that has a big summary](https://en.wikipedia.org/wiki/Optimizing_compiler))

- **algebraic reductions** (i.e., **partial evaluation**), like `x + 0 -> x` and `0 == 0 -> true` ^u82shw
- **peephole optimizations**, where we look at adjacent instructions in assembly and replace them with more efficient alternatives
- **[[register allocation]]**: the most frequently used vars should be kept in processor registers for fastest access.
- **[tail-call optimization](https://inst.eecs.berkeley.edu/~cs164/fa23/notes/16-Tail-Call.html)**: if we have a tail-call, we don't need to keep pushing function frames! see also [[continuation-passing style|continuations]]
- **bounds-checking elimination**
- **symbolic execution**: see [[CS 264 Notes]] for now

Crucially, these optimizations all enable one another. Copy propagation, global value numbering, and common subexpression elimination make each other possible!

# Runtime optimization

There are a few ways to optimize programs at runtime. **Just-in-time** (JIT) compilers produce customized machine code based on runtime data and input, at the cost of compilation overhead. Regex engines do this. Java HotSpot, JavaScript's V8, and Julia are common examples of this now.

- [x] [[Java Implementation and HotSpot Optimizations]] ✅ 2024-07-24

There are a few other important terms to know here:

- **Adaptive optimization** does dynamic recompiling of portions of a program based on the current execution profile. This is a general term that encompasses a few techniques: choosing whether to JIT or not, choosing whether to inline at runtime, etc.
- **Profile-guided optimization** is an ahead-of-time (AOT) strategy that uses runtime profiles to inform optimization. It's the static version of adaptive optimiztation.
- **Self-modifying code** can alter itself in response to runtime conditions.
- CPUs do lots of [[ahoDragon10112007|runtime optimization]]: **out-of-order execution**, **speculative execution**, **[instruction pipelines](https://en.wikipedia.org/wiki/Instruction_pipelining)** (running multiple instructions at once by staggering instruction fetch, decode, etc.), and **branch prediction**.

# Garbage collection

- [x] [[wilsonUniprocessorGarbageCollection1992|Uniprocessor garbage collection techniques]] ✅ 2024-07-23