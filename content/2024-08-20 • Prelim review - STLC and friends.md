# Definitions

- Substitution in term: $[var \mapsto new]term$
- Beta = eval, alpha = rename arg
- **Call-by-name**, i.e., **lazy**: no reductions inside abstractions.
- **Call-by-value**, i.e., **strict**: outermost application reduced, application only occurs if right-hand side is value (var or lambda, not another application).
- **Y combinator**: `fix = λf. (λx. f (x x)) (λx. f (x x))`
- de Brujin indices: $\lambda x. \lambda y. x\ y$ becomes $\lambda.\lambda. 1\ 0$.
- Non-value normal forms are **stuck**. Run-time error.
 	- A well-typed term is **normalizing** iff it's guaranteed to halt in finite steps.

See [[2024-06-17 • lambda calc]].

# Simply-typed lambda calculus

- Type safety = progress (well-typed term not stuck) + preservation (after eval, still well-typed)
 	- Well-typed term can make **eval progress**, well-typedness is **preserved** in eval
- **Curry-Howard**: types are propositions, programs are proofs.

```ebnf
t = x | λx:T. t | t1 t2
v = λx:T. t
T = T -> T | (* base types *)
C = null | C, x:T (* context *)
```

Eval: evaluate either side of application, then do substitution

$$
\begin{prooftree} \AXC{$t_{1} \to t_{1}'$} \UIC{$t_{1}\ t_{2} \to t_{1}'\ t_{2}$} \end{prooftree}
$$

$$
\begin{prooftree} \AXC{$t_{2} \to t_{2}'$} \UIC{$t_{1}\ t_{2} \to t_{1}\ t_{2}'$} \end{prooftree}
$$

$$
(\lambda x:T_{11}. t_{12}) \to [x \mapsto v_{2}]t_{12}
$$

Typing: variable type, lambda introduction and elimination

$$
\begin{prooftree} \AXC{$x:T \in \Gamma$} \UIC{$\Gamma \vdash x : T$} \end{prooftree}
$$

$$
\begin{prooftree} \AXC{$\Gamma, x:T_{1} \vdash t_{2}:T_{2}$} \UIC{$\Gamma \vdash \lambda x:T_{1}. t_{2} : T_{1} \to T_{2}$} \end{prooftree}
$$

$$
\begin{prooftree} \AXC{$\Gamma \vdash t_{1} : T_{11} \to T_{12}$} \AXC{$\Gamma \vdash t_{2} : T_{11}$} \BIC{$\Gamma \vdash t_{1}\ t_{2} : T_{12}$} \end{prooftree}
$$

> [!note] Big step eval
> ![[pierceTAPL2002#^32t7q5]]

See [[2024-06-17 • lambda calc]].

# Extensions

## Simple ones

- Derived forms & elaboration:  $t \to_{E} t'$ iff $e(t) \to_{I} e(t')$,  $\Gamma \vdash^E t : T$ iff $\Gamma \vdash^I e(t) : T$.
- Type ascription (`x as T`): evaluation removes ascription, introduction rule gives expr type `T`.
- Let binding: evals as substitution. Can be defined as sugar on *typing derivation* (transform into application of function), since we need extra info about type of let-bound var
- Tuples: records w/ projection. Eval rules for projection and if subpart of record evals. Typing for introduction and delimination.
- Variants: tag `<l = t> as T` and pattern match. Intro and elim (pattern match)
- Recursion: $fix\ (\lambda x. t) \to [x \mapsto fix\ (\lambda x. t)] t$
 	- ==Diverges==!

## References

- Introduction with `ref val`, elimination with dereferencing `!val`
- Internally, we have a new *location* value $l : \verb|Ref|\ T$, used for type-checking and eval.
- **Evaluation** is with respect to a store $\mu : Location \to Val$
 	- $t_{1} \mid \mu \to t_{1}' \mid \mu'$
 	- Substitution for stores: $[v_{1} \mapsto v_{2}]\mu$

- **Typing** with respect to $\Gamma$ **and** $\Sigma : Location \to Type$
 -

$$
\begin{prooftree} \AXC{$\Sigma(l) = T_{1}$} \UIC{$\Gamma \mid \Sigma \vdash l : \verb|Ref|\ T_{1}$} \end{prooftree}
$$
 - Do this for performance (don't need to typecheck reference every time) and to enable cyclic refs.

## Exceptions

- Multiple ways of modeling:
 	- **Panic**: $\verb|error|\ t_{2} \to \verb|error|$, $v_{1}\ \verb|error| \to \verb|error|$
 	- **try-catch**: standard
 	- **exceptions with values**: $(\verb|raise|\ v: T_{exn}) : T_{any}$ instead of $\verb|error|$.

See [[2024-06-26 • type system extensions]].

# Java-type beat

## Subtyping

- **Subsumption**:

$$
\begin{prooftree} \AXC{$\Gamma \vdash t : S$} \AXC{$S <: T$} \BIC{$\Gamma \vdash t : T$} \end{prooftree}
$$

- Records: **width** (records with more fields), **depth** (subtype between same field), **permutation** (order doesn't matter)
- Functions: **contravariant** (reversed) on first arg, **covariant** on second
 	- $S_{1} \to S_{2}$ must be usable at least wherever $T_{1} \to T_{2}$ is.
 	- $\bot <: \top$
- **Ascription**: upcast to supertype, downcast to subtype (assume during typechecking, evaluation only works if the type matches the downcast)
- References: **invariant** (both contra- and covariant on argument). Need covariance on read, contravariance on write.
- Coercion: maybe $Int <: Float$ even if they have different reprs, values. We can define a function that transforms typing derivations into terms with runtime coercions.
 	- Make sure we have **coherence**: different coercion paths yield same behavior
- Intersection, union types

See [[2024-06-26 • type system extensions]].

# Imperative objects in STLC

- **What the fuck is OOP**
 	- **Multiple representations**: An *abstract data type* (ADT) has an interface. Different classes can implement that interface, even if they have different internals.
 	- **Encapsulation**: hide object's internals, only expose `public` operations.
 	- **Open recursion** via `self` and **inheritance**.
- We store instance variables with a **representation type**: a record with instance variables. Each instance variable maps to a reference containing that var's state.
- A class is represented as a function that takes the instance variables, returning a record of functions that act on those vars.
 	- A class instance is that class function applied to a representation type.
 	- We can call superclass methods by let-binding to a superclass instance in the subclass
- Constructors create a new repr type and class and return the package.
- We can get `self` by adding an argument `self` to our class functions.
 	- `self` must have type `Unit -> Class`, to avoid diverging.
 	- We create an initially empty reference `cAux : Ref (Unit -> Class)` to the current class instance, binding `cAux := (whateverClass vars cAux)` in the constructor for the class.

See [[2024-07-03 • denotational semantics and fancy types]].
