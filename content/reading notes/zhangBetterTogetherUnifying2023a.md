---
aliases:
  - "Better Together: Unifying Datalog and Equality Saturation"
  - Better Together
  - egglog
tags:
  - reading
  - computer-science---programming-languages
year: 2023
authors:
  - Zhang, Yihong
  - Wang, Yisu Remy
  - Flatt, Oliver
  - Cao, David
  - Zucker, Philip
  - Rosenthal, Eli
  - Tatlock, Zachary
  - Willsey, Max
status: Todo
source: http://arxiv.org/abs/2304.04332
related: 
itemType: preprint
DOI: 10.48550/arXiv.2304.04332
scheduled: 2024-08-21
---
# Introductory notes on the project

> [!note]
> These are my notes when I was introduced to the project, dated Jul 27, 2022, taken from my Logseq. I've modified the notes to incorporate my existing writings on lattices.

## Starting with Datalog

Datalog can be seen as two different things:

- It's a **logic programming language** to make and deduce logical statements about relations between different objects
- It's a **language for interacting with databases** which allows for logic functions to deduce data/facts in the database

> [!important]
> This is a crucial point. **Datalog is part logical deduction system, part database.** Remember this.

The standard hello world example in Datalog is the _transitive closure_ example: a database which stores a graph and the edges between nodes, and deduces whether two nodes are transitively reachable from each other.

```datalog
p(x, y) :- e(x, y)
p(x, z) :- e(x, y), p(y, z)

e(1, 2)
e(2, 3)
e(3, 4)
```

^37ffb5

This example has two _relations_: things which are paired together.

- The first relation in this example is `e(x, y)`, which states that `x` and `y` related by the fact that there's a directed edge connecting `x` to `y`
	- Instances of this relation are manually asserted as _facts_ in the bottom of this example; for instance, we assert ourselves that there is an edge from node 1 to node 2.
	- Another way of looking at this is that `e` is a database table with two columns, `from` and `to`, containing all of the edges in a graph. At the bottom of the file, we're just writing "insert statements" to insert all of the edges we want into the table.
- The second relation in this example is `p(x, y)`, which is the transitive closure part. This relation states that `x` and `y` are related by the fact that there is some path through the graph from `x` to `y`
	- The first clause states if two nodes are connected by an edge, they're reachable (base case).
	- The second clause states if `x` and `y` are connected by an edge, and `z` is reachable from `y`, then `z` is also reachable from `x` (recursive case)  
	- In the database world, we're creating a new table `p` with entries for every node which is reachable from every other node. However, the thing to note is that this table is populated automatically by _deducing_ what entries should exist in the table based on the rules we've provided it.
		- For instance, we never explicitly say `p(1, 4)` is in the table, but we can deduce it based on the rules provided
		- In this sense, `p` is a table with a rule/function for how to generate the entries of the table!
	- In the logical programming perspective, `p(x, y)` gives rules for deducing whether two items are in the relation `p` based on facts about them
		- In the example, we assert `e(1, 2)` and `e(2, 4)` as facts, factual statements.
		- From these facts, we can logically deduce `p(1, 4)`

We can make the transitive closure example more complicated by turning the _reachability_ problem into a _shortest-path_ problem: instead of "is there a path from `x` to `y`?", we now have "what's the shortest path from `x` to `y` if it exists?"

But this problem is hard to solve in just straight-up Datalog. We can encode the problem in datalog like so:

```datalog
p(x, y, c) :- e(x, y, c)
p(x, z, c1 + c2) :- e(x, y, c1), p(y, z, c2)

e(1, 2, 4)
e(1, 3, 1)
e(2, 3, 6)
e(2, 4, 2)
```    

Now, both the edge and reachability relations have three arguments: `from`, `to`, and the cost of the edge. The edge and reachability tables get an extra column! Moreover, the reachability table's cost column is calculated dynamically based on the derivation of facts that it took in order to get from one node to another.

Note that this doesn't actually solve the min-cost problem: the `p` relation will contain every possible path (and thus every possible cost) from one node to another. For instance, `p(1, 3, 1)` and `p(1, 3, 10)` both exist in this relation/table.

Getting the min-cost would be done with something like this (hypothetical syntax):

```datalog
mc(x, y, c) :- let c = min(c) of p(x, y, c)
```
    
However, this would be prohibitively inefficient and might not even terminate. In particular, one core tenet of Datalog is that **facts are never forgotten**. Thus, the `p` relation records and remembers every possible cost that it would take to get from `x` to `y`, even thought we're only concerned with the min-cost.

Additionally, if our graph is cyclic, this would just straight-up never terminate. Ideally, we want to have a way to make the `p` relation only remember the minimum cost from `x` to `y`. If we have `p(1, 2, 3)` and `p(1, 2, 1)` asserted as facts, only the latter should be retained as a fact in the database, and the former should just be forgotten since we don't care about it

## Flix: Datalog with lattice semantics

**Flix** extends datalog to support **[[lattice|lattices]]** as arguments.

In our previous example, we can defined `p(x, y, c)` such that we use the $(\mathbb{Z}, \operatorname{min})$ semi-lattice for `c`. Thus, if we assert `p(1, 2, 1)` and `p(1, 2, 2)` as facts in the database, Flix will only remember the fact `p(1, 2, 1)`. This means that `c` is **functionally dependent** on `x` and `y`!

> [!tip]
> It's called a **function**al dependency since we can see this as `p` being a function from `x` and `y` to `c`!

> [!warning]
> They also have some fancy fixpoint algorithm stuff to efficiently compute the minimum, even in the presence of cycles and stuff like that. Maybe look into this more?

## egglog: egg with Flix semantics

An `egg` analysis is just a [[lattice|semi-lattice]]! And indeed, Flix relations are **exactly the same** as `egg` analyses!

Let's say you have a lower bound interval analysis. For each e-class, we record some lower bound `lo`. In Flix, this would be a relation `lo(e, x)` where `e` is an e-class and `x` is the value. In `egg`, we define `merge`—the semi-lattice join/meet, depending on which operation you choose—as `min`. In Flix, we would use the $(\mathbb{Z}, \operatorname{min})$ semi-lattice on `x`.

Additionally, we can straight-up represent e-nodes in Flix too! Let's say we have the following e-node type for our toy Herbie example:

```rust
enum Node {
	Num(f64),   // A literal number
	Add(Id, Id) // Adding two other nodes
}
```

We can convert these into Datalog relations:

```datalog
num(x: f64, e: Id)
add(e1: Id, e2: Id, e: Id)
```

- Each e-node variant becomes its own relation.
- Each variant stores its arguments (literal values or other e-class `Id`s) and the e-class `Id` that it belongs to.
	- In other words, we create a table for each type of e-node, where each entry in the table is an instance of that e-node variant with a certain set of arguments at the e-class `Id` that e-node belongs to
- There's a _functional dependency_ here: the arguments of the e-node uniquely determine the e-class `Id` it belongs to
	- `Num(1.0)` can only belong to one e-class :^)

So, we can represent e-classes, e-nodes, and analyses in a Datalog-style format. The only thing we're missing is an **equality relation** and **equality saturation**, and we can implement all of `egg` inside Datalog! So let's just full send it and combine the two! Let's combine Datalog/Flix with equality saturation!

**This is egglog.**

One benefit of this is that e-matching between e-nodes in this table/database format is way more efficient (remember that Datalog is part logical deduction system, and part database!). Another benefit is composability of analyses!
