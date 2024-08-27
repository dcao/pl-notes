> [!note] See also
> This borrows from [the Wikipedia article for value numbering](https://en.wikipedia.org/wiki/Value_numbering), along with [this Cornell CS 6120 page](https://www.cs.cornell.edu/courses/cs6120/2019fa/blog/global-value-numbering/) and [this Tufts CS 257 lecture doc](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/value-numbering.pdf).

**Value numbering** is a technique for determining when two computations are equivalent.

# Global value numbering

**Global value numbering** (GVN) is a technique for determining when two computations are equivalent which operates on [[ahoDragonBookGrammars2007#§ 6.2.4. Single static assignment (SSA)|SSA form]]. This technique is complementary to [[ahoDragonBookMachineindependent2007#Partial-redundancy elimination|common subexpression elimination]], since each aims to eliminate redundant computation, and each catches cases that the others do not. Since this is *global*, this applies across basic blocks.

In essence, we associate unique IDs with each expression, and associate variables with these IDs. We assign and record IDs such that equivalent expressions will have the same ID. We then replace variables that reference equivalently ID'd expressions with references to each other.

The simplest way of explaining this is walking through an example. Let's say we had the following code:

```
w := 3
x := 3
y := x + 4
z := w + 4
```

Whenever we encounter a variable assignment, like `w := 3`, we compute a **value number** for the expression being assigned—a kind of unique ID for that expression, basically. In this case, we assign the expression `3` with value number `1` in a hash table. We then associate `w` and this value number with each other using two hash tables to go in either direction.

Then, in `x := 3`, we see that `3` already has a value number—`1`. We also note that there already exists a variable corresponding to value number `1`: `w`. Thus, $w \equiv x$, and we replace this statement with `x := w`.

In `y := x + 4`, we first get the value numbers for each expression of the operation, yielding `(1) + (2)` (we've assigned a new value number for `4`). We rewrite the expression to `y := w + 4` and assign a new value number.

Then, when we see `z := w + 4`, the expression will also have the same value number, since the expression is also `(1) + (2)`. So we can just do `z := y`.

## SSA?

This technique relies on SSA, since it falls apart if a variable can hold multiple different value numbers. We can't make the same guarantees about equivalence anymore.

We treat $\phi$ expressions like any other operation. So for example, we might have `y = phi(a, b)`. We find the value numbers corresponding to `a` and `b`, yielding `phi((n), (m))`. If we have already seen the expression `phi((n), (m))`—it has a value number and corresponds to another variable—we can replace!

> [!note] See also
> https://pages.cs.wisc.edu/~fischer/cs701.f07/lectures/Lecture24.4up.pdf

## GVN vs CSE

CSE can deal with lexically identical expressions. GVN can handle underlying equivalence:

```
a := c * d
e := c
f := e * d
```

There's no shared lexical expressions here, but `f` and `a` are equivalent. GVN can handle this!