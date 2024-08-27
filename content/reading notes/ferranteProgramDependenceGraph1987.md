---
aliases:
  - "The program dependence graph and its use in optimization"
tags:
  - reading
year: 1987
authors:
  - Ferrante, Jeanne
  - Ottenstein, Karl J.
  - Warren, Joe D.    
status: Todo
source: https://doi.org/10.1145/24039.24041 
related:  
itemType: journalArticle  
journal: "ACM Trans. Program. Lang. Syst."  
volume: 9  
issue: 3   
pages: 319–349  
DOI: 10.1145/24039.24041
scheduled: 2024-08-01
---
A **program dependence graph** (PDG) is an alternate representation of programs, where nodes are statements or conditional predicates, and edges are drawn between nodes that *depend* on each other. For instance, in the following code:

```c
1: int a = 4;
2: int b = a + 3;
3: int c = a + 6;

4: if (c > 10) {
	5: int x = b + c;
}
```

...we would have edges $1 \to 2$, $1 \to 3$ and $3 \to 4$, but no edges between $2$ and $3$, since they are independent; these are *data dependencies*! Additionally, we would have an edge $4 \to 5$, since the evaluation of $5$ depends on the value of $4$; this is a *control dependency*. This kind of representation is beneficial for a number of reasons:

- **Auto-parallelization**.
	- This representation is unlike a [[ahoDragonBookBasic2007|control flow graph]], since for nodes whose concrete values or execution don't depend on each other, we don't enforce any sort of ordering on them!
	- Thus, this representation only exposes *necessary* data dependence/sequencing, exposing opportunities for parallel computation!
	- This was the original motivation for this development
- **Improving performance of [[2024-07-10 • optimizations and gc|program optimization]]**.
	- Lots of program transformations can be computed with a single walk of these dependences, since computationally relevant parts of the program are directly connected.
	- Also, unlike a *data dependence graph*, we also expose control dependencies (e.g., the edge $4 \to 5$).
	- Thus, transformations like vectorization and code motion that rely on knowing both data and control dependencies are easily handled!
- **Allowing for incremental [[ahoDragonBookMachineindependent2007|dataflow analysis]]**.
	- This representation allows for an *incremental dataflow algorithm* that permits *incremental optimization* as dataflow information is updated.

# The program dependence graph

When actually implementing this, we construct two sub-graphs: a graph for *control dependence* and a graph for *data dependence*. We can then combine the edges of these two graphs to get our full PDG.

## Control dependence

We define control dependence in terms of a [[ahoDragonBookBasic2007|control flow graph]] and [[ahoDragonBookMachineindependent2007#Dominators|dominators]]! Remember that we say $m$ dominates $n$ iff all paths from `ENTRY` to $n$ pass through $m$. Similarly, we say that a node $o$ **post-dominates** $n$ iff all paths from $n$ to `EXIT` pass through $o$. A node doesn't post-dominate itself.

Given two nodes $X$ and $Y$ in a CFG, $X$ is **control dependent** on $Y$ iff:

1. $Y$ post-dominates *all nodes* in any path from $X$ to $Y$ (not including $X$ and $Y$), but
2. $Y$ doesn't post-dominate $X$.

Basically, $Y$ is control dependent on $X$ if $X$ has at least one path where $Y$ is always executed, and at least one where $Y$ might not be.

> [!note]- A diagram of this
> Here's a diagram from [CSE 231 @ UCSD, FA12](https://cseweb.ucsd.edu/classes/fa12/cse231-a/lecture-14.pdf)'s lecture slides that makes this clear:
>
> ![[Screenshot 2024-08-02 at 5.12.08 PM.png]]

## Building a control dependence graph

### Identifying control dependence

To actually build this, we first build a post-dominator tree (parent immediately post-dominates children) using a modified CFG, where we add a node `ENTRY` with a `T` edge to `START` and a `F` edge to `STOP`. To get the post-dominator tree, we build the dominator tree for the reverse CFG, which is just a dataflow problem! (See the notes above).

Let $S$ be the set of all edges $A \to B$ in the CFG where $B$ doesn't post-dominate $A$ (i.e., $B$ is **not** $A$'s ancestor in the post-dominator tree). By definition, in these edges, $A$ must have multiple paths of execution flowing out of it, one of which might not execute $B$. Thus, each of these edges will be labeled with either true or false.

> [!example]-
> As an example, here's an unmodified CFG for a program:
> 
> ![[Screenshot 2024-08-02 at 11.55.39 AM.png]]
> If we build the post-dominator tree for this program, we get:
> ![[Screenshot 2024-08-02 at 12.00.34 PM.png]]
>
> Building the set $S$ from this, we have: $$ S = \{ (ENTRY, START), (1, 2), (1, 3), (2, 4), (2, 5), (3, 5) \} $$
> 
> The intuition is that $S$ consists of all edges where $B$ may or may not be executed depending on the execution of $A$. Note that we have $ENTRY \to START$ but not $ENTRY \to STOP$, since $STOP$ post-dominates $ENTRY$; either $ENTRY$ goes directly to $STOP$, or it'll go through the rest of program execution and end up there eventually.

Each edge $A \to B$ in $S$ corresponds to a number of nodes that should be marked as being control dependent on $A$. There are two possible cases here:

- If $A$ is an ancestor of $B$ in the post-dominator tree, we mark all nodes on the path up from $B$ to $A$ as being control dependent on $A$.
	- This occurs when we have loops: when $B$ is the last node in a loop body, and loops back to $A$ depending on a condition.
	- $B$ is first in the CFG, but $A$ post-dominates.
	- The post-dominator tree is kind of backwards: $EXIT$ is always on top!
- Otherwise, we mark all nodes from the path up from $B$ to the **parent** of $A$ as being control dependent on $A$.
	- This node is *guaranteed* to be the *least common ancestor* of $A$ and $B$.
	- We know it must be an ancestor of $B$ since if it weren't, it wouldn't be able to be an ancestor of $A$, since ==TODO==
	- It must be the parent of $A$ since that is $A$'s immediate post-dominator.

> [!note]
> Note that above, we stated by definition that $B$ can't post-dominate $A$. But we never said anything about the other way around!

This first step takes $O(N^2)$ with respect to the number of nodes in the CFG:

- Post-dominator tree construction is $O(N \log(N))$?
- $S$ is determined in $O(E) = O(N)$ time.
- Each edge in $S$ takes $O(N)$ time to walk—worst case, the height of the post-dominator tree is a straight line, meaning $O(EN) = O(N^2)$ time.

### Adding region nodes

Now, let's say based on the analysis above, we have a bunch of nodes with the same *control dependences*: a false edge from node $x$, a true edge from node $y$, etc. Instead of having $x$ and $y$ point repeatedly to different nodes with the same set of control conditions, we instead add a **region node**. Region nodes group together all nodes with the same set of control conditions; if a bunch of nodes have the same set of conditions, we create a region node and add all those other nodes as children. In this way, predicates don't need to have a billion different edges out to all of the different nodes that are control dependent on it!

Thus, every region node corresponds to a set of control dependences, each of which is a node *potentially* labeled as true or false.

This is a kind of *common subexpression elimination*: if multiple different nodes have the same set of control dependences, we factor out those control dependences into a single region node that gets pointed to instead. Additionally, because of this, predicates only have two successors, like in CFG: the true and false cases, instead of "all the trues" and "all of the falses."

Eventually, our goal is to create a bunch of region nodes, where for each region node $R$, the control dependence predecessors are a set of control dependence predecessors for at least one node $N$ in the post-dominator tree, and its successors are all nodes whose control dependence predecessors are exactly the same as $N$.

To create these region nodes, we let's look at our control dependences, and perform the following steps:

- Examine every node $N$ that has other than a single unlabeled control dependence predecessor. This node $N$ has a set of control dependence predecessors $CD$.
	- We do a *[[ahoDragonBookMachineindependent2007#^121596|postorder traversal]]* over the post-dominator tree, visiting children left-to-right, then parents.
	- This means $O(N^2)$ runtime, with respect to number of nodes $N$.
	- Remember that the set of control dependences of ancestors in the post-dominator tree don't necessarily have a subset relationship with respect to those of its children!
- Extract $CD$ into its own region node $R$. $R$'s predecessors are now $CD$, and $N$'s predecessor is $R$.
	- We keep a map from sets of CDs to region nodes.
- Check the *intersection* $INT$ between $CD$ and each of its children $C$'s CDs, $CD_{C}$
	- If $CD_{C} = CD$, we can make the child just depend on $R$ instead.
	- If $CD_{C} = INT \subseteq CD$, replace whatever those dependences are in $R$ with the child's predecessor.
		- After processing a node, it will only have one predecessor
		- And children are processed first!
- Set $R$'s successors to all nodes
- It's assigned $CD$ as its predecessors, and its successors are all the nodes that are control dependent on exactly this set. 
- Finally, for every predicate node, we want to make sure it only has one false edge and one true edge
	- If there's multiple false edges, create a new region node, have the false edge point to that, and have all the false successors receive from that new region node instead.

> [!example]-
> ![[Screenshot 2024-08-02 at 4.51.47 PM.png]]
> 
> The left image shows the whole process up until the last "Finally" step. The right image shows the completed process.

### Approximating control dependence

> [!danger]
> I haven't fully understood this part. I don't fucking get it. Do another pass at some point.

It's difficult to recreate the CFG from the control dependence graph above, which is important for source-to-source translators and generating sequential code. For instance, with node $6$ from above, how do we place it such that we don't duplicate nodes or Boolean tests?

Instead, we're gonna create an **approximate control dependence graph**. This graph has two properties:

- It's much better suited for generating efficient control flow
- For "structured programs" (i.e., [no gotos](https://en.wikipedia.org/wiki/Structured_programming)?), this is equivalent to the actual control dependence graph.
	- This paper was written in 1987. This was a concern they had back then
	- Even when it's not, it's better than the CFG is lmao

At a high level, the issue with our previous version of CDGs was what information region nodes encoded. Before, region nodes stood in for a set of conditional predicates that were true at that point; they had a single predecessor—==usually? or always?== a true/false edge from a predicate—and all of its successors were items where the conditional predicates were at least what was contained in this region node. It created hierarchical structure in the CDG.

However, this says nothing about how its descendants should be ordered when going back to a CFG! To ameliorate ==this==, we want regions to hold some extra information. Specifically, they can now have two kinds of control dependence successors:

- First, a region node can point to the *entry node of a hammock*, a subgraph within the CFG that has single entry and exit nodes.
	- A *hammock* is a subgraph within the graph with associated *entry* and *exit* nodes. ^0e12cf
	- Its properties, formally:
		- All edges from $(G - H)$ to $H$ go to entry node $V$.
		- All edges from $H$ to $(G - H)$ go to exit node $W$.
		- $V \in H, W \not\in H$.
	- More informally:
		- All edges into the hammock must go to the entry node.
		- All edges out of the hammock must go to the exit node.
		- Basically, the hammock is like an island in the control flow graph, where all inputs go through the entry, and all outputs go through the exit
		- The exit is considered not part of the hammock.
	- If $X \in H$ and $Y \not\in H$,  $Y$ isn't control dependent on $X$.
		- If $Y$ is the exit node, it necessarily post-dominates $X$.
		- Otherwise, for a given exit node $W$, we know all paths from $X$ to the exit must go through the exit node $W$. If $Y$ were to be control dependent on $X$, $Y$ would post-dominate $W$. This would mean $Y$ post-dominates $X$, which is a contradiction.
	- Note that hammocks can have sub-hammocks!
	- These edges will always point to nodes.
- Second, region nodes can have a number of *exit edges*.
	- These are like exit edges of a basic block; they can optionally be labeled with true/false.
	- After we do the translation, these edges will point to other regions.
- Additionally, each region now contains state about the subhammocks (all nodes and edges) it "corresponds" to.
	- This correspondence can be exploited for generating code from the control dependence graph, as we'll see below

This approximation is computed by repeatedly transforming the CFG in place:

- First, we detect **hammocks** in the control flow graph.
- Second, add a new region $R$ and a new edge $EXIT \to R$.
- Third, convert each predicate node into a region node.
	- Region nodes now contain a list of "subhammocks" as state: this is initialized to the empty set.
- Fourth, apply some transformations to turn the CFG into a control dependence graph!
	- Process in *inverse topological order*: end-to-beginning.
	- These transformations do two things:
		- Move some nodes/subhammocks around.
		- Add the subhammock to the region node involved.
	- Type 1: make exit node with no non-hammock predecessors a predecessor to entry node
		- ![[Screenshot 2024-08-02 at 5.32.17 PM.png]]
		- Because we're going in inverse topological, the exit node is *guaranteed to be a region.*
		- We also add the hammock into the state of the region node being pointed to.
		- $V$ is the entry node of the hammock.
	- Type 2: for exit node with other predecessors, create region node with subhammock and exit edge to exit node
		- ![[Screenshot 2024-08-02 at 5.42.41 PM.png]]

We can exploit this construction for efficient code generation:

- To generate code for a hammock, generate code corresponding to its region nodes in topological order of control dependencies.
- To generate code for a region, generate code for the "corresponding" set of hammocks of that region in topological order of inter-hammock data dependencies.

## Data dependence

> [!note]- Prerequisite: what is an "upwards exposed use"
> The text makes mention of this without defining it. Here's a slide from some Georgia Tech notes:
> 
> ![[Screenshot 2024-08-03 at 11.54.29 AM.png]]
> 
> This is also known as a *reachable use*. It's kind of like availability, but it's not "has this been already referenced."

To figure out data dependence, we make a DAG for each basic block during program parsing. Each [upwards exposed use](https://en.wikipedia.org/wiki/Upwards_exposed_uses) in a block corresponds to a DAG leaf node, called a *merge node*. We then do [[ahoDragonBookMachineindependent2007#Reaching definitions|reaching definition]] analysis, and connect reaching definitions to their use sites. Thus, a merge node represents the *set* of reaching definitions at that point—all the predecessors are all the reaching definitions.

The concept is pretty simple, but there are some complications for common language features:

- **I/O** operations act on an implicit file object.
- **Array operations** are assumed to act on the entire array.
	- We can try doing vectorization, etc. by rephrasing all loop indices as operations on a loop index from 1 to the size of the array
	- Check dependence analysis
- Aliasing and pointers complicate things, often requiring ==interprocedural analysis==

> [!note] Def-use chains
> We can also define data dependence in terms of two sets: $def(S)$ (variables defined in this statement) and $use(S)$ (variables referenced in this statement). If a variable in $def(A)$ is later used in $use(B)$, there's a flow/data dependence from $A \to B$. This is transitive; if $A \to B$ and $B \to C$, we say there is a **def-use chain** from $A \to C$.
> 
> See https://piazza.com/class_profile/get_resource/hy7enxf648g7me/i2qodoub2q73x for more.

These dependences can be categorized as *loop-carried* or *loop-independent*.

- **Loop-carried** data dependences is caused because of loop iterations; e.g., a definition from one iteration referenced during the next iteration.
- **Loop-independent** data dependences occur because of execution order, regardless of how many times any loop is iterated.

Note that **there can be self-edges** in a data dependence graph!

# Practical use cases

Okay. What can we use a PDG for?

- **Detecting parallelism**.
	- Any node not in a [strongly connected region](https://en.wikipedia.org/wiki/Strongly_connected_component) of both data and control dependencies can be vectorized.
		- i.e., if some nodes don't either data or control depend on one another, they can be vectorized!
	- With only a data dependence graph, you have to do "if-conversion" to turn control structure of program into data dependencies, which makes it difficult to recover original control structure after
	- See [[ahoDragon10112007#Synchronization between parallel loops|Dragon §11.8]] for more details.
- **Node splitting**
	- We purposefully duplicate nodes to enable better parallelism, less IPC.
	- Here's an example control flow graph and associated PDG: ![[Screenshot 2024-08-03 at 1.17.12 PM.png]]
	- Here, `X = P`. We could duplicate the `X`, `D`, and `E` on both branches of `P` and eliminate `X`.
	- But this isn't clear in the CFG.
		- Either we have to duplicate `A`, `B`, and `C` going all the way down, or we have to try and move `X` earlier in the control flow graph.
	- In the PDG, successors of a region node only need to be ordered in data-dependency order when running.
		- We immediately know that `X` can follow `P`, since there's no data dependency on one another.
		- Thus, we know we can move it up earlier in the CFG, and then do scalar propagation to eliminate `X` on both branches.
- **[[ahoDragonBookMachineindependent2007#^9d6c9d|Code motion]]**
	- We can do loop-invariant code motion faster, and with arbitrary control flow!
	- In general, we can move whatever wherever as long as we don't change the PDG!
- **Loop fusion**
	- We can join loops if:
		- They're executed under same conditions
		- There's no data dependence between loops
		- They're executed the same number of times
	- The first two are trivially checkable in a PDG.
	- The last is also accomplished by checking the hierarchical PDG for e.g., if `do` loops iterate the same number of times
- **[[program slicing|Program slicing]]**
	- See also: 
	- A slice shows a set of statements that influence the value of a variable at a particular program point.
	- We need to see what data and control flow dependencies lead to this variable!

# Incremental data flow update & optimization

Compilers will often transform source programs for optimization purposes. When we mean incremental data flow updates and incremental optimization, we mean incremental in this sense—updating with granularity with respect to *compiler source changes*, not arbitrary user programmer program changes. The former is much more limited in scope, the latter is not.

Basically, we're describing ways to **incrementally update dataflow information** while doing compiler optimizations. Additionally, we can do **incremental optimization**: applying additional optimizations during an incremental dataflow update. Here, we describe how this algorithm works with respect to two specific optimizations.

## Branch deletion

Sometimes a compiler can delete a conditional branch that it determines will never be taken. If a def-use path goes through this deleted branch, we can only delete the corresponding data dependence if no other paths exist that don't go thru that branch.

Our incremental solution first adds *output dependence edges* to the PDG: treating a definition as a use of a variable. Next, we update our control dependencies: ^cb6382

- Anything in the region pointed to by the "predicate is false" edge is deleted.
- The original predicate computation node is deleted.
- Everything that used to be in the "predicate is true" region is placed in a region dependent on P's CDs.

> [!note] Antidependence
> There is also the concept of an *antidependence* edge: the reverse of a regular data dependence, where we add an edge from use to definition.

Next, we incrementally update our dataflow information. This is hard to explain in the abstract, so we're gonna walk through an example. Here's a short pseudocode program:

```
B = ???      // 1
if P then    // 2
  A = ???    // 3
  B = ???    // 4
else         // 5
  A = ???    // 6
endif        // 7
??? = A      // 8
??? = B      // 9
```

And here's the corresponding PDG for this program:

![[Screenshot 2024-08-03 at 3.18.58 PM.png]]

First, note that we've added *output dependence edges*, labeled with a circle. $1 \to 4$ is an output dependence edge since $4$ redefines `B`; we want to enforce that `4` comes after `1`. Now, assuming the true branch is always taken, we need to delete the $1 \to 9$ edge: $B$ will always be defined in $4$ now! Also note that this is a diagram of the PDG *before* the branch deletion has happened! If we were to do branch deletion, `ENTRY` would point straight to nodes 1, 3, and 4.

So how can we formalize this intuition? Well first, some notation:

- Let $CP(d)$ be the control predecessor of a node, and let $LCA(d, p)$ be the least common ancestor of $d$ and $p$ in the [[ahoDragonBookMachineindependent2007#Depth-first ordering|depth-first spanning tree]] of the CFG.

And now, here's the formalization:

- First, let $d$ be a node in the "predicate is true" region, and consider pairs $(p, d)$ where $d$ is *output dependent* on $p$ and both have a data dependence successor $m$.
- If $CP(d) = LCA(d, p)$, we have an issue: this implies $p$ can reach $m$ through $d$, which is incorrect; delete the edge $p \to m$.
- How does this apply to our current situation?
	- $CP(4)$ is `ENTRY`. $LCA(4, 1)$ is also `ENTRY`. Both $4$ and $1$ point to $9$ (data dependence).
	- This implies we can get to $9$ through either just $4$, or $1, 4$. i.e., $1$ can reach $9$ through $4$.
	- We should delete $1 \to 9$ since $1 \to 4 \to 9$ should be the only path.

There's another case we have to consider too! For instance, see:

```
loop
  if P then A = ???
  ??? = A
  A = ???
endloop
```

if `P` is always true, the definition on line 2 will always kill the definition on line 4. The first definition is loop-independent, because it executes regardless of # of iterations. The second definition is loop-carried—the definition *carries* across loop iterations. Here, $4$ is output dependent on $2$, and $m$ data depends on both. But we only want to preserve the item that's prior in the output dependence, since now we know it'll always execute.

- Let $d$ be a node in the "predicate is true" region, and consider pairs $(d, s)$, where $s$ is output dependent on $d$, and both have a data dependence successor $m$.
- If $CP(d) = LCA(d, s)$, and $(d, m)$ is a *loop-independent* data dependence edge, but $(s, m)$ is a *loop-carried* data dependence edge, $d$ should prevent $s$ from reaching $m$. Delete $s \to m$.

One last wrinkle: in the general case, *several definitions along several paths* might kill another definition. To solve this, we create a *pseudo-definition* for a variable in a region, and a correspondence dependence edge, if *all* paths in that region have that definition and that dependence.

![[Screenshot 2024-08-03 at 4.22.26 PM.png]]

In this CFG and PDG example, we can group the assignments for $A$ at $3$ and $4$ into a pseudo-definition of $A$ at $2$, since it's assigned in both branches. We can then update according to rule 1.

We add pseudo-definitions at a region if *some* successor has a definition. Additionally, we propagate backwards up until we reach a least common ancestor of:

- A definition in the altered "predicate is true" region
- Another definition of $p$ that the previous is output dependent on

During propagation, only examine definitions output dependent on $p$.

## Loop peeling & unrolling

Loop peeling is one step of loop unrolling. We can move dependences to point to the peeled iteration. Additionally, if you have weird GOTO stuff happening, you can reduce control dependencies into the loop:

![[Screenshot 2024-08-03 at 4.29.09 PM.png]]

To modify PDG, add output dependence from peeled iteration to loop. Loop body's control dependences are only on the loop predicate; all others moved to peeled iteration. Data dependences within loop body updated.

Incremental dependence update requires additional case to deal with labels and gotos:

- If $d$ output dependent on $p$, and both have $m$ as data dependence successor.
- If $(d, m)$ is loop-independent, $d$ should prevent $p$ from reaching $m$. Remove $p \to m$.