- operational for imp
- denotational, axiomatic
- domain theory

# Operational semantics in IMP

**IMP** is a simple imperative language with numeric expressions, bool expressions, and *commands*.

```ebnf
a = n | X | a1 + a2 | a1 - a2 | a1 * a2
b = true | false | a1 = a2 | a1 <= a2 | not b | b1 and b2 | b1 or b2
c = skip | X := a | c1; c2 | if b then c1 else c2 | while b do c
```

Operational semantics in IMP maps a command and state to a new state: $$ \langle c, \sigma \rangle \to \sigma' $$
For type-checking imperative languages where we need to propagate changes to the context, we can write it as so: $$ \Gamma \vdash t : T \dashv \Gamma' $$
See [[2024-07-29 • Justin, prelim grab bag]], **Winskel** §2 (no notes).

# Denotational semantics

- **Denotational semantics** are good for mathematically representing programs to compare different PLs and prove *equivalence* of programs.
- Programs map to mathematical **domains**.
	- e.g., a boolean expression $b \in Bexp$ denotes a function from states to a boolean value $\mathcal{B}[\![b]\!] : \Sigma \to Bool$
	- $\mathcal{C}[\![c]\!] : \Sigma \to \Sigma$
	- Represent functions as sets of pairs, do set union and such.
- A while expression $w \equiv \verb|while|\ b\ \verb|do|\ c$ is $\verb|if|\ b\ \verb|then|\ c; w\ \verb|else skip|$
	- We can get an equation for $\mathcal{C}[\![w]\!]$ in terms of itself; specifically, an equation for the denotation of up to $n$ iterations of $w$, in terms of $\mathcal{C}[\![w]\!]$ for $n - 1$ iterations.
	- We can run this to fixpoint to get $\mathcal{C}[\![w]\!]$ for all iterations.
- **Domain theory** lets us prove that we'll get to fixpoint, even if our domain isn't ordered by set inclusion.
	- Domain theory, and specifically partially ordered sets and lattices, are used for lots of different things.
		- Their use in this context is different than in dataflow analysis, which is slightly different than in abstract interpretation. ==Be careful!==
	- Let $\Gamma(w)$ produce the next iteration of the denotation for a prior iteration $w$.
		- We define the *partial ordering* operation as denoting that "greater" functions have *more information* (i.e., have more input/output pairs): $\Gamma(w) \sqsubseteq \Gamma(\Gamma(w))$
	- In general, a **poset** is a set with a $\sqsubseteq$ operation.
		- For concision, in this doc, if $a \sqsubseteq b$, we say $a$ "less than" $b$.
	- A **chain** is an equal/increasing sequence of elements. A **least upper bound** (**lub**) is the smallest item that's greater than the whole sequence.
	- A **complete partial order** (cpo) is a poset where all chains have lubs. A **domain** is a cpo with $\bot$.
	- Functions on cpos can be **monotone** (preserve order), **continuous** (f of lub is same as lub of f on each), and **strict** ($f(\bot) = \bot$)
	- **Tarski's fixed point theorem**: monotone functions on lattices have **complete lattices of fixed points, with least and greatest fixed points** ([source 1](https://www.cs.cmu.edu/~rwh/courses/atpl/pdfs/tarski.pdf), [Wikipedia](https://en.wikipedia.org/wiki/Knaster%E2%80%93Tarski_theorem))
		- Why this matters: if we can prove that if $f : D \to D$ is monotone and that $D$ is a valid domain, $f$ has a least fixed point: the least element $x$ such that $f(x) = x$.
- There are many cpos
	- Products (projection and function products are continuous, $f$ is monotone/continuous if it's the case for each item in product), continuous functions between cpos (apply, curry, and fixpoint continuous), flat domains (ground types like $Nat$ with $\bot$), disjoint union

See also: [[2024-07-03 • denotational semantics and fancy types]] ([[winskelWinskelDenotationalSemantics1993|Winskel 5: The denotational semantics of Imp]], [[denotational semantics and domain theory]]), [[lattice]]

# Axiomatic semantics

- Hoare rules:
	- **Partial correctness** $\{ A \}c\{ B \}$: if $A$, then $B$ or stall
	- **Total correctness** $[A]c[B]$: partial correctness with halting guarantee.
	- $\sigma \models A$: $A$ holds under state $\sigma$.
	- $\{ A \}c\{ B \} \stackrel{\text{def}}{=} \forall \sigma \in \Sigma. \sigma \models A \implies \mathcal{C}[\![c]\!]\sigma \models B$, assuming $\forall A. (\mathcal{C}[\![c]\!]\sigma = \bot) \models A$
- $\vdash \{ A \}c\{ B \}$ means "we can proof derive it," $\models \{ A \}c\{ B \}$ means "it actually holds"
	- **Soundness** is "derive means holds," **completeness** is "holds means derivable"
- Example rules
	- While: $$ \begin{prooftree} \AXC{$\{ I \land E \}c\{ I \}$} \UIC{$\{ I \} \verb|while|\ E\ \verb|do|\ c\{ I \land \neg E \}$} \end{prooftree} $$
	- If we can show that the body $c$ maintains the invariant (when the loop condition is true)
	- The whole loop maintains this invariant, and after the loop $E$ is false.
	- To prove what we actually want to prove, use **precondition strengthening** and **postcondition weakening**.
		- Stronger assertions imply weaker ones: $x \geq 10 \implies x \geq 0$
		- If it's true with stronger precondition, it will necessarily also be true for original weaker precondition: $$\{ x \geq 0 \}c\{ y \geq 4\} \rightsquigarrow \{ x \geq 10 \}c\{ y \geq 4 \}$$
		- If we can show true for stronger postcondition, it will still be true for weaker postcondition: $$\{ x \geq 10 \}c\{ y \geq 4 \} \rightsquigarrow \{ x \geq 10 \}c\{ y \geq 0 \}$$
- When proving, we want to find **weakest precondition**: the least strict requirement on our program for it to maintain some property.
	- $wp(c, B)$: calculate weakest precondition $A$ such that $\{ A \}c\{ B \}$.
		- This is also known as **predicate transformer** semantics: we're transforming a program and postcondition predicate into a precondition predicate.
	- $wp(\verb|if E then c1 else c2|, B) = (E \implies wp(c_{1}, B)) \cap (\neg E \implies wp(c_{2}, B))$
	- while loop: $W = (b \implies wp(c, W)) \land (\neg b \implies B)$.
		- Oh fuck. ==It's recursive==.
- A **verification condition** is a weakish precondition that's computationally tractable and doesn't have weird recursive shit.
	- the while loop follows the trick we did with Hoare rules for while loops: $vc(w, B) = I \land (I \land E \implies vc(c, I)) \land (I \land \neg E \implies B)$
		- $I$ holds on entry.
		- if $I \land E$, the invariant holds after.
		- Otherwise, $B$ must hold.
	- This is **backwards VC**, which accumulates nested substitutions.
		- $wp(c_{1};c_{2}, B) = wp(c_{1}, wp(c_{2}, B))$
		- $wp(x := e, B) = [x \mapsto e]B$
	- We can do **forwards VC**, keeping **symbolic state** from variables to concrete symbolic values (i.e., unevaluated except for substitution)
		- VC is now an *interpreter*, instead of a recursive procedure with base cases for the leaves of our program.
		- $VC(k, \Sigma, Inv)$: program counter, symbolic program state, *invariant state* (what invariants have we seen before?)

See also: [[2024-08-09 • Parker, prelim grab bag - axiomatic semantics]], [[CS 264 Notes#Introduction to Program Verification 9 6 9 11]], [[2024-07-03 • denotational semantics and fancy types]] ([[winskelWinskelAxiomaticSemantics1993|Winskel 6, 7, 8: Axiomatic semantics and domain theory]])