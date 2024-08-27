---
aliases:
  - "SSA is functional programming"
tags:
  - reading
year: 1998
authors:
  - Appel, Andrew W.    
status: Todo
source: https://dl.acm.org/doi/10.1145/278283.278285 
related:  
itemType: journalArticle  
journal: "ACM SIGPLAN Notices"  
volume: 33  
issue: 4   
pages: 17–20  
DOI: 10.1145/278283.278285
scheduled: 2024-07-25
---
> [!summary]
> [[ahoDragonBookGrammars2007#§ 6.2.4. Single static assignment (SSA)|SSA]] is the same as [[continuation-passing style|CPS]]. The algorithm for finding SSA is the same as finding optimal nesting in CPS. In this algorithm, wherever a variable is defined, we need $\phi$s for that variable in the **dominator frontier** of that node. The **dominator frontier** consists of all nodes who are successors of dominated nodes, but are not themselves dominated.

The core thesis: **SSA and lambda calculus are doing the same thing**. Imperative languages compile down to basic blocks and flow edges, functional languages compile to lexically nested functions. **They're the same in different notation!**

# Motivation for SSA

Sometimes we want to find the use-sites of each defined variable, or conversely, the definition-sites of each variable in an expression. The *def-use chain* is a data structure that holds, for each statement, all *use* sites of variables defined there, and all *definition* sites of the variables used there. But if a variable has $N$ definitions and $M$ uses, this will require $N \times M$ pointers! Not good.

Hence, SSA:

![[ahoDragonBookGrammars2007#§ 6.2.4. Single static assignment (SSA)|Dragon Book 5, 6.2.4: grammars & SSA]]

# Where to place $\phi$s?

So how do we convert into SSA? Specifically, how do we rename variables and where do we put $\phi$s?

![[Screenshot 2024-07-25 at 2.10.56 PM.png]]

One dumb approach: split every variable at every basic-block boundary, and use $\phi$ for every variable in every block:

> [!note] Example of crude placement
> ![[Screenshot 2024-07-25 at 2.09.49 PM.png]]

Lot of useless copies... what can we do about that?

# Taking inspo from functional programming

We can instead express the program as a set of mutually recursive functions, where each function represents a basic block, and its arguments represents the locals in the program.

![[Screenshot 2024-07-25 at 2.16.03 PM.png]]

In this representation, a basic block might correspond to a function: $f_{2}(i_{2}, j_{2}, k_{2})$. Transferring control from basic block to basic block is represented by calling function. This is a form of [[continuation-passing style]].

If, in that function, $j_{2} = \phi(j_{1}, j_{7})$ for instance, that would correspond to two different calls into $f_{2}$ that assign different values of $j$: $f_{2}(\dots, j_{2}, \dots)$ and $f_{2}(\dots, j_{7}, \dots)$.

When actually writing programs in this style though, normally we don't define a ton of mutually recursive functions; instead we take advantage of nested scope to reduce repetition:

![[Screenshot 2024-07-25 at 2.16.18 PM.png]]

In this case, since we only ever use one value of $i$, we can just leave that in the outermost scope.

Here's the key: **the best way to nest definitions is the same as the optimal SSA form!**

![[Screenshot 2024-07-25 at 2.18.06 PM.png]]

# The algorithm for optimal $\phi$s

We only need a $\phi$ where two different definitions reach the same point. How do we know?

Well, let's look at blocks 1 and 2, for instance. Only one definition of $i$ makes it to block 2, even though it has two inputs. This is because block 1 *[[ahoDragonBookMachineindependent2007#Dominators|dominates]]* block 2! All paths to block 2 must pass through block 1, and so the definition of $i$ always comes from there.

Additionally, we say that if there's an edge $b \to c$, and a node $a$ that **strictly** dominates $b$ (i.e., $b$ does not strictly dominate itself) but not $c$, then $c$ is in the *dominance frontier* of $a$. ^0ugvw5

Let's assume that at the start node, we initializing all variables with some definition. If a node $n$ defines a variable, then by definition, the nodes in the dominance frontier of $n$ are reachable (and could thus inherit variable definitions) from two different places: $n$ (by definition), and the start node (since it dominates everything and $n$ doesn't dominate this node).

Thus, the rule is: **whenever node $n$ defines variable `x`, all nodes in the dominance frontier of $n$ need a $\phi$-function for $x$.**

Because of the equivalence above, we can say that this algorithm converts imperative procedures into well-structured functional programs with nested scope.

# What we can learn

**For SSA users**: one important property of SSA is that a variable definition dominates all uses (or for a use within a $\phi$-function, dominates a predecessor of the use). This is made implicit in SSA explanations, but is made explicit when we represent SSA as nested scopes—function nesting encodes domination!

**For functional programmers**: learn how to use flow charts and boxes lmao:
> Functional programmers often get lost in the notation of functional programming, which is a shame.

