---
source: https://web.stanford.edu/class/archive/cs/cs108/cs108.1082/handouts/39ImplementationHotspot.pdf
---
We examine Java and HotSpot—the Java VM—as examples of runtime optimizations.

# The Java Virtual Machine

- The Java compiler compiles Java to JVM bytecode. Why?
	- Portability benefits
- It's a stack machine to avoid depending on register count
	- JIT/HotSpot translates this to use registers

# HotSpot VM

This is implemented as a **JIT compiler**: bytecode is compiled to native CPU code at runtime based on if it's called enough to justify the compilation cost for runtime gain. JIT-compiled code can also be cached (as Julia does!)

Locals are faster than instance variables: prefer `int localWidth = piece.getWidth()` and using `localWidth` versus calling `piece.getWidth()`, since this encourages the JIT compiler to pull the value into a native register, rather than read/write to a place in memory.

In general, the JIT can aggressively rewrite code. We want to encourage it to do good memory-touching patterns

## Inlining

The VM also makes heavy use of [[inlining]]—pasting called code into caller code. This enables lots of other optimizations:

- We don't need to pass parameters, so long-living values can stay in one register for the whole computation, saving on memory (traffic)
	- i.e., preventing *register spilling*
- **Propagation of analysis**
	- Let's say fn `A` is doing a for loop with index `i` into array `a`, and calls fn `C`, which indexes into `a`
	- Normally, in `C`, we would need to do a bounds check
	- But once we inline, we can remove that bouunds check!
	- Similar applies for: checking if a pointer is null, checking instanceof on a pointer.