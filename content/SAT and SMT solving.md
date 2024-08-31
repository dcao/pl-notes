This note collects a number of resources on *SAT and SMT solving*, particularly as used for [[program synthesis]].

> [!note] See also
> The Wikipedia pages for [SAT](https://en.wikipedia.org/wiki/SAT_solver) and [SMT](https://en.wikipedia.org/wiki/Satisfiability_modulo_theories).

# What is SAT and SMT?

> [!note] See also
> [[2024-04-02 • CS 294, 11Tu – SMT]]

A **SAT solver** is a program that solves the **Boolean satisfiability problem**. Basically, given a formula on Boolean variables, can we find an assignment for those variables such that the formula returns true? This problem is *NP-complete*.

A formula is satisfiable if there exists inputs to make the formula true. It is *valid* if all inputs make it true.

In **satisfiability modulo theories (SMT)**, we augment SAT with **theories**, which tell us how symbols—including literals, variables, functions, and predicates—should be interpreted. Thus, they are interpretations that map symbols to elements in a domain (i.e., a *universe*), uninterpreted functions to functions within that universe, and uninterpreted predicates to predicates on universe elements.

> [!warning] What kinds of logics can SMT handle?
> The 294 notes claim that SMT solvers can handle first-order logic. The [Wikipedia page](https://en.wikipedia.org/wiki/First-order_logic) for it claims that first-order logic includes quantifiers, as does [[pierceATAPLDependentTypes2005|ATAPL 2: Dependent types]].
> 
> However, in practice SMT solvers need some modifying to get quantifiers. They're probably closer to *propositional logic* in that case (as described in the ATAPL 2 notes).

> [!definition] Ground formula
> A *ground formula* is a formula that doesn't contain any free variables (though it can contain uninterpreted functions/predicates). If we're trying to solve for some variables with our solver, we consider those variables not as variables, but as constants (of unknown value).

## Different theories

- **Equality with uninterpreted functions** (EUF): only equality. Decidable in polynomial time with *congruence closure*: build DAG with edges for function calls and dotted edges for equivalences.
- **Arithmetic**: *Presburger arithmetic* (nats with add, not multiply; i.e., linear integer arithmetic (LIA)) is decidable. Multiplication isn't.
- **Arrays**: *read* and *write* operations that obey certain axioms. NP-complete, but works well in practice. Used to model arrays and memory
- **Fixed-width bit-vectors**: NP-complete.
- **Inductive data types**: e.g., `List = Cons | Nil`. Decidable if you only have one constructor, NP-complete in the general case.

You might choose different theories if you want decidability guarantees. In general, more complex theories lose you performance.

More precisely, the **signature** of a theory is the set of predicate and function symbols of the theory. Note that 0-arity functions are *constants*. A **model** gives meaning to this signature, mapping constants to items in the universe, and functions and predicates appropriately.

When we colloquially talk about "theories" and "models," we do some mixing of terms here. The colloquial "theory" contains some parts of the model: a definition for $+$, for example. When we talk about "finding a model," normally we mean finding the *values for constants* in a model.

## Combining theories

> [!note] See also
> Referencing [[barrettSatisfiabilityModuloTheories2008|Satisﬁability Modulo Theories]] §12.6.

When doing complex software verification—where each datatype might be modeled by a separate theory—we might want to *modularly* combine a number of theories.

*In general*, you can't do this, since individual satisfiable theories might combine to become unsatisfiable. But, you can restrict the theories and their combinations in such a way to make this possible!

Basically, let's say you have two theories $\mathcal{T_{1}}$ and $\mathcal{T_{2}}$. Each of these has symbols $\Sigma_{1}$ and $\Sigma_{2}$. The idea is that if we have a formula $\varphi$ containing a mix of $\mathcal{T_{1}}$ and $\mathcal{T_{2}}$ stuff, we want to **purify** this formula, turning it into the **pure formula** $\varphi_{1} \land \varphi_{2}$, where $\varphi_{1}$ only contains symbols from $\Sigma_{1}$ and a new constant universe $C$ (which we use to facilitate communication between the two theories), and $\varphi_{2}$ contains symbols from $\Sigma_{2} \cup C$.

The purification process basically says: if we're trying to build $\varphi_{1}$ and we see some subterm $t$ that should be in $\varphi_{2}$, we replace that subterm with a constant $c$ in $\varphi_{1}$ and add an equation $c = t$ to $\varphi_{2}$.

Then, for all constants $C_{0}$ in both $\varphi_{1}$ and $\varphi_{2}$, we randomly guess if each pair of those constants is equal or not. This is called an *arrangement*, denoted $ar_{R}(C_{0})$, where $R$ is the equivalence relation we're guessing. To actually try solving, pass in $\varphi_{i} \land ar_{R}(C_{0})$ to each solver $i$.

This setup is *sound* (no false positives) and *complete* (no false negatives) under the following conditions:

- The theories are **signature-disjoint**: their set of predicate and function symbols are non-overlapping. Remember that function symbols can include 0-arity functions, i.e., constants!
- The theories are both **stably infinite**: every satisfiable ground formula is satisfiable in a model of the theory with an infinite universe.
	- If this isn't the case, there is loss of generality when considering only infinite models.
	- This restriction can be lifted when using sorted (i.e., typed) logic and communicating cardinality constraints on other types?

> [!danger] TODO
> There's a lot more about implementing this; I haven't looked at that.

# How does an SMT solver work?

> [!note] See also
> [[barrettSatisfiabilityModuloTheories2008|Satisﬁability Modulo Theories]]

Broadly, there are two approaches to SMT solving:

- **Eager approaches**: translate the formula to an equisatisfiable (only SAT if the original is SAT, even if they have different models) Boolean formula in a single step, then solve that.
	- Translations are theory-specific.
	- For e.g., the combined theories of equality & linear integer arithmetic (LIA), lambdas are inlined and applied, function applications are turned into constants with extra constraints on functional consistency (i.e., $a_{1} = a_{2} \implies f(a_{1}) = f(a_{2})$).
		- There are other ways of transforming certain kinds of linear constraints.
- **Lazy approaches**: augment SAT solvers with decision procedures for first-order theories. e.g., CVC5, Z3.

> [!danger] TODO
> There's more on implementation here that I haven't really touched on.

# Use cases

Different problems in programming can be reframed as SMT solver problems!

- **Software testing and program verification**: see [[godefroidDARTDirectedAutomated2005|DART: directed automated random testing]] and [[CS 264 Notes#DART and CUTE Concolic Testing]]
- **[[program synthesis|Program synthesis]]**
	- https://www.cs.cornell.edu/~asampson/blog/minisynth.html
	- https://docs.racket-lang.org/rosette-guide/ch_essentials.html
- **Automated theorem proving**: the guy who made Lean also created Z3 beforehand!
- **Program analysis**