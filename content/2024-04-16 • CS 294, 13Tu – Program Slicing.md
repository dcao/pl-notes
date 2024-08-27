![[294_10_15_Program_Slicing.pdf]]

```
a = 23
a = a + 1
b = a + 3
c = 4
c = a + 2
a = a + c
print a
```

Let's say we only want to see all the lines involved with affecting variable `a` at line 7. How do we find all the lines that could have affected variable `a` at that point?

This is called [[program slicing]]. The answer is *calculating the relevant set*, which is an intermediate analysis we perform that helps with figuring out if we need the line in the slice.
- Calculating the relevant set is an analysis that's specifically useful for program slicing
- It uses other analyses—`def` (what vars are defined at this line, i.e., is an lvalue) and `ref` (what vars are reference at this line, i.e., is an rvalue)—that are present throughout PL literature

Let's walk through this example and see what's happening.

## Step 1: fill out $\text{ref}$ and $\text{def}$

The first step is to fill out the $\text{ref}$ and $\text{def}$ analyses, since those are pretty easy to get.

| n     | code        | $\text{ref}(n)$ | $\text{def}(n)$ | $\text{relevant}(n)$ | In slice? |
| ----- | ----------- | --------------- | --------------- | -------------------- | --------- |
| 1     | `a = 23`    | $\{  \}$        | $\{ a \}$       |                      |           |
| 2     | `a = a + 1` | $\{ a \}$       | $\{ a \}$       |                      |           |
| 3     | `b = a + 3` | $\{ a \}$       | $\{ b \}$       |                      |           |
| 4     | `c = 4`     | $\{  \}$        | $\{ c \}$       |                      |           |
| 5     | `c = a + 2` | $\{ a \}$       | $\{ c \}$       |                      |           |
| 6     | `a = a + c` | $\{ a, c \}$    | $\{ a \}$       |                      |           |
| 7<br> | `print a`   | $\{ a \}$       | $\{  \}$        |                      |           |
## Step 2: set initial $\text{relevant}$ value

Now, we start building our $\text{relevant}$ analysis. This analysis is a *backwards analysis*; you start in a point later in the program, and go backwards.

If we're looking at line 7 at the variable `a`, we know that trivially, `a` at this point is relevant to the value of `a` at this point :)

| n     | code        | $\text{ref}(n)$ | $\text{def}(n)$ | $\text{relevant}(n)$ | In slice? |
| ----- | ----------- | --------------- | --------------- | -------------------- | --------- |
| 1     | `a = 23`    | $\{  \}$        | $\{ a \}$       |                      |           |
| 2     | `a = a + 1` | $\{ a \}$       | $\{ a \}$       |                      |           |
| 3     | `b = a + 3` | $\{ a \}$       | $\{ b \}$       |                      |           |
| 4     | `c = 4`     | $\{  \}$        | $\{ c \}$       |                      |           |
| 5     | `c = a + 2` | $\{ a \}$       | $\{ c \}$       |                      |           |
| 6     | `a = a + c` | $\{ a, c \}$    | $\{ a \}$       |                      |           |
| 7<br> | `print a`   | $\{ a \}$       | $\{  \}$        | $\{ a \}$            |           |
## Step 3: work backwards

We're gonna define $\text{relevant}$ backwards, going thru 6, 5, etc.

How is this useful? Well, let's look at a node $m$ that is predecessor of node $n$. If $m$ references some variable that is relevant at node $n$, we should include $m$ in our slice.

We initialize relevant with the line and variable we're interested in. So we're interested in $a$ at line 7, so we initialize the relevant set at that point.

In order to propagate this analysis backwards, there are two rules we need to follow:

1. $\text{relevant}(m) = \text{relevant}(n) \setminus \text{def}(m)$: if something is defined in line $m$, we've created a discontinuity. Variables that rely on the value of this variable before 
2. If $\text{def}(m) \subseteq \text{relevant}(n)$, $relevant(m) = relevant(n) \cup ref(m)$.
	1. If we care about variables defined at $m$ , we care about everything referenced in that definition.

A more intuitive way of saying this is: if we have a set of variables that are relevant to our slice, when going backwards, if a relevant variable is defined there, replace that variable with the variables it references!

$relevant$ is important because it determines if a statement should be in our slice. A statement $m$, succeeded by $n$, should be included if $def(m) \subseteq relevant(n)$; if it defines something that's relevant later on. Basically, $relevant$ tracks "variables we'd be interested in seeing definitions for."

Here's the completed table:

| n     | code        | $\text{ref}(n)$ | $\text{def}(n)$ | $\text{relevant}(n)$ | In slice? |
| ----- | ----------- | --------------- | --------------- | -------------------- | --------- |
| 1     | `a = 23`    | $\{  \}$        | $\{ a \}$       | $\{  \}$             | y         |
| 2     | `a = a + 1` | $\{ a \}$       | $\{ a \}$       | $\{ a \}$            | y         |
| 3     | `b = a + 3` | $\{ a \}$       | $\{ b \}$       | $\{ a \}$            |           |
| 4     | `c = 4`     | $\{  \}$        | $\{ c \}$       | $\{ a \}$            |           |
| 5     | `c = a + 2` | $\{ a \}$       | $\{ c \}$       | $\{ a \}$            | y         |
| 6     | `a = a + c` | $\{ a, c \}$    | $\{ a \}$       | $\{ a, c \}$         | y         |
| 7<br> | `print a`   | $\{ a \}$       | $\{  \}$        | $\{ a \}$            |           |

## Control dependences

> [!note]
> From this point on, I'm writing these notes in the future, post-Prelim study. This relies on knowledge from [[ahoDragonBookMachineindependent2007|Dragon Book 9: Machine-independent optimization]] and [[ferranteProgramDependenceGraph1987|The program dependence graph and its use in optimization]].

Consider the following code:

```rust
let x = todo!();
let mut a = 2;
if (x >= 12) {
	a = 4;
}
println!(a)
```

The slice for this program at `println!(a)` should just be the whole program! `a`'s assigned value depends on the evaluation of the predicate `x >= 12`. In turn, we should show the whole slice for the predicate `x >= 12` in our slice for `println!(a)`.

Basically, whenever a statement in the slice has control dependences, we must include the slice for the predicate of each control dependence. This means for every statement, we record the control dependences for that statement. When we include a statement, we add the slice for at the predicate statement and all of its referred variables.

![[Screenshot 2024-08-04 at 11.00.38 PM.png]]
![[Screenshot 2024-08-04 at 11.01.03 PM.png]]

