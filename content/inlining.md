> [!note] See also
> This takes a lot of content from the Wikipedia article for [inlining](https://en.wikipedia.org/wiki/Inline_expansion).

**Inlining** replaces a function call site with the body of the called function. This occurs during compilation. Notably, it can have ==complicated effects on performance!== 

# Performance impact

The direct benefits of inlining are:

- **No function call overhead**. No arguments on the stack, no branch or jump, etc.
- **Reduced register spilling**. We don't need to use registers to pass arguments, meaning we don't need to move variables out of registers.
- **Reduced indirection**. If using call by reference, we don't need to pass references and then dereference them.
- **Potentially improved locality of instructions**. Since we eliminate branches and keep code that's executed together close in memory. However, this isn't always the case; see below.

However, the main benefit we unlock is being able to take into account the inlined body of the function is optimizations; they're no longer separated across function boundaries!

- We can do constant propagation and loop-invariant code motion into the procedure body (see [[ahoDragonBookMachineindependent2007#Partial-redundancy elimination|partial-redundancy elimination]])
- We can do dead-code elimination (see [[ahoDragonBookMachineindependent2007#Liveness analysis|liveness analysis]])
- Register allocation can be done across the larger body
- Higher-level optimizations like [[escape analysis]] and [[tail duplication]] can be performed on a larger scope and be more effective.

For example, if we have this code:

```c
int pred(int x)
{
    if (x == 0)
        return 0;
    else
        return x - 1;
}

int func(int y) 
{
    return pred(y) + pred(0) + pred(y+1);
}
```

...we can inline the predicate, yielding:

```c
int func(int y) 
{
    int tmp;
    if (y   == 0) tmp  = 0; else tmp  = y - 1;       /* (1) */
    if (0   == 0) tmp += 0; else tmp += 0 - 1;       /* (2) */
    if (y+1 == 0) tmp += 0; else tmp += (y + 1) - 1; /* (3) */
    return tmp;
}
```

...which, with dead-code elimination, gets us to:

```c
int func(int y) 
{
    if (y == 0)
        return 0;
    if (y == -1)
        return -2;
    return 2*y - 1;
}
```

The drawbacks are potentially increased code size and worse instruction cache performance due to code expansion. If the expanded code pushes out of L1 cache capacity, performance can get way worse!

Compilers choose based on programmer hints and their own heuristics. For instance, [[Java Implementation and HotSpot Optimizations|Java HotSpot]] uses dynamic runtime profiling to figure out what to inline. Additionally, JIT compilers can:

- dynamically speculate on which code paths will result in the best exec time improvement;
- dynamically adjust their cost heuristic for inlining, based on how much has been inlined so far;
- inline clusters of subroutines at once