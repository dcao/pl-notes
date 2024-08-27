---
aliases:
  - "Dragon Book 8.4: Basic blocks & control flow graphs"
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
This section is a pretty basic overview of **basic blocks** and **control-flow graphs** (CFGs). Should be mostly review so I skimmed this basically.

## Basic blocks

In short, we divide up our intermediate code into *basic blocks*. Within a basic block, execution enters at the start of the block—its first instruction—and continues without halting, branching, or jumping until the last instruction of the block. These blocks form a *control flow graph*, with directed edges between BBs showing where control flow can go.

A *leader* is a start of a basic block.

## Use and liveness

Often times we want to know when a var's value will be used next. Let's formally define the notion of a **use** of a name.

Let's say statement $i$ assigns a value to variable `x`.  If statement $j$ uses `x`, and execution flows from $i$ to $j$ without `x` being reassigned to, we say $j$ *uses* the value of `x` computed at statement $i$. We also say that `x` is **live** at statement $i$.

To find liveness, we go backwards from the end of a basic block. When starting, assume all variables are live. Whenever we hit an assignment, we set the assigned var to "not live" and its used operands to "live."

## Control flow graphs

CFGs connect basic blocks:

![[Screenshot 2024-07-18 at 11.04.57 PM.png]]

Nodes can have *successors* and *predecessors*. There is also *entry* and *exit* nodes.

## Loops

A set of nodes $L$ forms a loop if $L$ contains a node $e$ called the loop entry, such that:

1. $e$ isn't `ENTRY`.
2. No node in $L$ besides $e$ has a predecessor outside of $L$.
3. Every node in $L$ has a non-empty path, completely within $L$, to $e$.

