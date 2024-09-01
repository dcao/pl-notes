# Questions

- What's the difference between a type system and an abstract interpretation? When would you want to use one over the other?
- Could you give an example of a type system that could prevent division-by-zero errors?
- Say you have a language of integer expressions. Define the concrete and abstract domains for a sign analysis on this language.
	- ![[Screenshot 2024-08-01 at 1.37.54 PM.png]]
	- `in` is given by a state value given to the concrete interpreter.
- Draw the lattice for this abstract domain.
- Write the abstraction $\alpha$ and concretization $\gamma$ functions for this abstract interpretation.
- Describe the relationship between $\alpha$ and $\gamma$; what property must hold?
- Define the abstract interpretation for this language for literals and `in`.
- What should the abstract interpretation of the following expressions be?
	- $\{ + \} - \{ + \}$
	- $x / \{ 0 \}$
- State the soundness property with respect to $\alpha$ and/or $\gamma$.
- If the first expression resulted in $\bot$, would this be sound?
- If the second expression resulted in $\top$, would this be sound?
- How could you use this analysis to tell if an expression will *definitely* divide by 0?
- How could you use this analysis to tell if an expression *may* divide by 0?
- Are there any cases where this analysis is not *complete*—i.e., it says there is a potential ("may") divide by 0, but dividing by 0 is actually impossible?
- How could you ameliorate this?

# Board

![[286AE906-7486-4A38-B760-771771AF5DD9_1_105_c.jpeg]]

# Notes

- **Think aloud**! Even if I'm lost, talking through my thinking is critical.
- **[Partial evaluation](https://en.wikipedia.org/wiki/Partial_evaluation)**: this is the term for anything where we partially evaluate a program at compile time.
	- This also includes *[[2024-07-10 • optimizations and gc#^u82shw|algebraic reductions]]*/*term rewriting*
	- Also includes constant function execution, etc.
	- This is the solution to the very last question
- **Soundness for Galois connections**: ^ccq950
	- Given a concrete interpreter $E(e, \sigma)$ that takes expr $e$ and state $\sigma$, and given an abstract interpreter $A(e)$:
	- $E(e, \sigma) \in \gamma(A(e))$
		- The actual concrete execution must be one possible outcome forecasted by our abstract interpretation.
	- Apparently this is something guaranteed with trace semantics, etc. too?
- **Type system pros/cons**: type systems are **modular**
	- vs abstract interpretation which is *whole program*
- **[[2024-07-10 • optimizations and gc|Program optimization]]** is the term for CFA, const prop, etc.
	- Abstract interpretation is a means to program optimization

## Follow-ups

- [x] Look into trace semantics and all that—maybe one of [Cousot's papers](https://www.di.ens.fr/~cousot/COUSOTpapers/publications.www/Cousot-LNCS2000-sv-sb.pdf) ⏳ 2024-08-23 ✅ 2024-08-26
