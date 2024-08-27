---
aliases:
  - Verification tools for finite-state concurrent systems
  - Model checking
tags:
  - reading
  - automatic-verification
  - binary-decision-diagrams
  - model-checking
  - temporal-logic
year: 1994
authors:
  - Clarke, E.
  - Grumberg, O.
  - Long, D.
editors:
  - de Bakker, J. W.
  - de Roever, W. -P.
  - Rozenberg, G.
status: Todo
related: 
itemType: conferencePaper
location: Berlin, Heidelberg
pages: 124-175
DOI: 10.1007/3-540-58043-3_19
ISBN: 978-3-540-48423-3
scheduled: 2024-08-20
---
> [!warning]
> For more on model checking, see https://ptolemy.berkeley.edu/projects/chess/eecs149/lectures/Reachability.pdf
> Maybe look at this at some point and take more detailed notes if you want to dive more into model checking!

- **Temporal logic model checking**: express specs for finite-state concurrent systems in temporal logic, with circuit/protocol as state-transition system.
	- $\mathbf{G} f$: true in the present if $f$ is always true.

# Binary decision diagrams

**Ordered binary decision diagrams** (OBDDs) represent boolean formulas.

We can start with binary decision trees:

![[Screenshot 2024-08-26 at 12.34.49 PM.png]]

To make this way more compact, we can turn this into a **binary decision diagram**: a DAG basically!

![[Screenshot 2024-08-26 at 12.58.00 PM.png]]

We can also use this to represent relations. The function is set membership.

# Kripke structure

Explanation of Kripke structures as detailed here:

![[henzingerLazyAbstraction2002#Background on model checking|Lazy abstraction]]

For a Kripke structure $(S, R, L)$, where $S$ is set of states, $R : S \times S$ is transition relation, and $L : S \to \mathcal{P}(AP)$ is analysis, we can build a lattice of predicates $Pred(S)$ where each predicate is represented as set of states $S$ where it's true, and ordering is set inclusion.

Any $F : Pred(S) \to Pred(S)$ is called a **predicate transformer**.

## Computation tree logics

In computation tree logics, we have a number of quantifiers:

- Branching operators: $\mathbf{A}$ (all computation paths), $\mathbf{E}$ (for some computation paths)
- Linear time operators: $\mathbf{G}$ ("always"), $\mathbf{F}$ ("sometimes"), $\mathbf{X}$ ("nexttime"), $\mathbf{U}$ ("until")

There are *state formulas* and *path formulas*.

# Fixpoints

The 

> [!danger] TODO
> Lots of stuff I've skipped over here

# Symbolic model checking

We can describe a symbolic model checking algorithm for CTL that takes in CTL formula and returns OBDD corresponding to states of system that satisfy formula.

> [!danger] TODO
> And lots of stuff I haven't finished taking notes on