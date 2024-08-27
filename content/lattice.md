---
aliases:
  - partial order
  - semi-lattice
---
> [!note] See also
> [[ahoDragonBookMachineindependent2007#Semilattices]]

A lot of different program analysis techniques rely on the concept of a *lattice*. What the hell is a lattice?

# Partial ordering

Let's say we have a set $L$. A *partial ordering* $\sqsubseteq$ is a relation $\sqsubseteq : L \times L \to Bool$ that has three properties:

- **Reflexivity**: $l \sqsubseteq l$
- **Transitivity**: $a \sqsubseteq b \land b \sqsubseteq c \implies a \sqsubseteq c$
- **Anti-symmetry**: $l_{1} \sqsubseteq l_{2} \land l_{2} \sqsubseteq l_{1} \implies l_{1} = l_{1}$

We call $(L, \sqsubseteq)$ a *poset*.

*See also*: [[denotational semantics and domain theory#Partial orders in the abstract]]

# Lattices: meet and join

Lets say we have a subset $Y \subseteq L$. A **lattice** is defined by two operations: **meet** and **join**.

- **Join** $\sqcup$ returns the **least upper bound** between items in the lattice.
	- $\sqcup Y$ is an upper bound of items in $Y$, such that any other upper bound is even larger.
	- $x \sqcup y$ or $x \lor y$ is the upper bound between $x$ and $y$.
	- The element $\top$ is the *greatest* element. $\top = \sqcup L$.
	- We're moving through the lattice in the direction of the *gap*: **up**!
	- In [[denotational semantics and domain theory#^p8q4xi|domain theory]], we use least upper bounds (*lubs*) to order recursive function invocations and provide a concrete upper bound on their denotations.
		- If an imperative statement is a function from state to state, in the limit, what does a while loop's function behavior loop like? That limit is the least upper bound of infinitely many recursive invocations of the loop.
- **Meet** $\sqcap$ returns the **greatest lower bound** between items in the lattice.
	- $\sqcap Y$ is an upper bound on items in $Y$, such that any other upper bound is even larger.
	- $x \sqcap y$ or $x \land y$ is the upper bound between $x$ and $y$.
	- The element $\bot$ is the *least* element. $\bot = \sqcap L$.
	- We're moving through the lattice in the direction of the *gap*: **down**!
	- In [[ahoDragonBookMachineindependent2007#Semilattices|dataflow analysis]], we use a *meet semilattice*—a lattice but with only the meet operation—to combine dataflow information at CFG intersection points.
		- In this context, larger values denote more precise analyses.
		- For instance, in constant propagation, $\bot = NAC$, indicating no precision on what constants the value could be, and $\top = UNDEF$, indicating a variable with the possibility of "the most precision": being unanalyzed so far!

> [!note] Notation
> Sometimes, we use $\lor$ for join and $\land$ for meet. Interchangeable, mostly

To make sure that join and meet have agreeing behavior, we enforce a rule called **absorption**: $$ a \sqcup (a \sqcap b) = a \sqcap (a \sqcup b) = a $$
Note that the meaning of $a \sqsubseteq b$ is kind of arbitrary! For instance, in dataflow analysis, we assign $a \sqsubseteq b$ to mean that $b$ provides a more precise analysis. However, in [[nielsonPrinciplesProgramAnalysis1999b#^ceopk4|abstract interpretation]], the convention is to flip this meaning: $a$ is now the more precise analysis! Additionally, in [[denotational semantics and domain theory]], we use join to compare function *specificity*: greater functions are defined on more inputs.

In general, what you can rely on is that in $a \sqsubseteq b$, $a$ goes down the lattice, and $b$ goes up.

Also note that $\sqcup \varnothing = \bot$ (the smallest upper bound of nothing is the smallest item), and similarly $\sqcap \varnothing = \top$ (the largest lower bound of nothing is the largest item).

In a **complete lattice**, every subset of $L$ has a least upper bound *and* greatest lower bound. In [[denotational semantics and domain theory#^p3ai2j|domain theory]], a poset where every subset has a least upper bound is called a *complete partial order*.

# Semi-lattices

With semilattices, you only have one of these operations, either join or meet.