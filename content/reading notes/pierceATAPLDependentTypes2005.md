---
aliases:
  - "ATAPL 2: Dependent types"
tags:
  - reading
year: 2005
editors:
  - Pierce, Benjamin C.    
status: Todo 
related:
  - "[[pierceAdvancedTopicsTypes2005]]"  
itemType: bookSection  
publisher: MIT Press  
location: Cambridge, Mass.  
ISBN: 978-0-262-16228-9
scheduled: 2024-07-23
---
Dependent types are types that depend on terms.

# Motivations

Consider the *type family* of vectors with static length (1D arrays):

```
Vector : Nat -> Type
```

`Vector` is a function that takes a natural number and returns a type! So `Vector 3` is a type: a 1D array of length 3. (We assume `Vector`s are like. `Nat` vectors or whatever)

When typing functions that reference terms in types, we introduce the terms with a *dependent product type* (i.e., a *Pi type*):

```
init : ∏n : Nat. data -> Vector n
```

In general, a pi type $\Pi x:S. T$ is an *arrow* type that maps elements $s : S$ to elements $[x \mapsto s]T$. The type varies with the value of the term supplied! I wanna emphasize that this is a generalization of arrow types: $S \to T$ is just $\Pi_{x:S}\ T$ where the term $x$ doesn't appear in $T$.

This is also kind of like the universal type $\forall X. T$ in System F, only instead of depending on the *type* supplied, it depends on the *term* supplied.

Dependent `printf` is the other example here. You know this lmao

## Dependent types and Curry-Howard

With Curry-Howard, a formula has a proof iff the corresponding type is inhabited:

![[pierceTAPL11Simplytyped2002#^z7i5wb]]

Propositions are types and proofs are terms. This is *constructive logic*, or *intuitionistic logic*, or *propositional logic*. This doesn't include universal quantifiers, however.

With dependent types, we upgrade to a stronger logic: first-order logic (i.e., *predicate logic*), with quantified variables. If we want to prove $\forall x:A. B(x)$ for some predicate $B$, we just need to show that $\Pi x: A. B(x)$ is inhabited! For instance, showing that $\forall x: Nat. x + 0 = x$ requires a proof of the type: $$ \Pi_{x:Nat}\ x + 0 = x $$
We need a function that takes in a natural number $x$ and returns a proof that the number $x$ plus zero equals itself!

## Logical frameworks

> [!danger] TODO
> This shit went over my head immediately lmao

# λLF: Pure first-order dependent types

**λLF** is one of the simplest systems of dependent types. The LF comes from the Edinburgh Logical Framework, a system that provides mechanisms for representing syntax and proof systems that make up a logic.

In λLF, we replace the arrow type with the dependent product type, and we introduce type families. It is *pure* since it only has $\Pi_{}$ types, and it's *first-order*, since it doesn't include higher-order type operators like $F^\omega$—type families can't take type families as arguments, and there's no universal quantification. This is enough for the $\forall,\to$ fragment of first-order predicate calculus.

![[Screenshot 2024-07-23 at 2.02.57 PM.png]]

This is basically what Haskell has (minus universal quantification!). The highlights:

- Types don't have arrow types, but dependent product types and type family application.
- We introduce *kinds*: types of types. A type has kind $*$, and a type family has kind $\Pi_{x:T}\ T$.
- Contexts keep track of the *kind* of type variables, since they could stand in for a type *or* a type family.
- Types can be a dependent product type, or a type family application.
	- A dependent product type, like `init` has kind $*$.
	- But a type family, like `Vector`, has kind $\Pi_{x:T}\ K$.
	- Note that we're using $\Pi_{}$ for both dependent product types and type family kinds!
- We add a bunch new rules.
	- We add rules for kind well-formedness. A kind is either $*$, or a function to a well-formed type $\Pi_{x:T}\ K$.
	- We add rules for checking the *kinds* of types—type variable lookup, dependent product type introduction, type family elimination, and *conversion under kind equivalence* (see below)
	- For typing, application also performs substitution into the output type. And we add *conversion under kind equivalence*.

## Equivalence

In the above system, we can replace swap in equivalent types and kinds where needed. We need this because we have terms that can be evaluated in types now—should $T\ ((\lambda x:S. x) z) \equiv T\ z$? What about $3 + 4 \equiv 7$ (at the type level)?

In λLF, we use *definitional equality*—only including basic equalities that are obvious, a viewpoint favored by Martin-Löf. This makes typechecking decidable! Here are the equivalence rules, which define equivalence structurally:

![[Screenshot 2024-07-23 at 2.19.35 PM.png]]

A few things:

- You can define equivalence in terms of untyped reduction, but this is less extensible, and requires you to establish properties of untyped reduction.
- You can include more equalities at the cost of requiring arbitrary computation to typecheck.

Because equivalence is so important for typechecking, and since it relies on evaluating terms, it becomes vital that reduction is **strongly normalizing**—always guaranteed to terminate. The future sections mention beta-reduction (function application) and weak head normal form reduction (see below) a lot, since they are strongly normalizing, and so our typechecking will rely on them a lot.

## Properties

1. Permutation and Weakening: Suppose a context is a subset of another, then a judgment in the first implies the judgment in the superset.
2. Substitution: a type-safe substitution in the context, holds a judgment under substitution.
3. Agreement: judgments in the system are in agreement, e.g., $\Gamma \vdash T :: K \implies \Gamma \vdash K$.
4. Strong Normalization: The beta-reduction $\to_{b}$ is **strongly normalizing** (guaranteed to terminate) on well-typed terms.
5. ==TODO: something about confluence==

## Algorithmic typing

To make this amenable to an algorithm, we make the rules *syntax-directed* so they can define an algorithm going from premises to conclusion. We also need an algorithm for type equivalence.

![[Screenshot 2024-07-23 at 2.26.54 PM.png]]

The main change is instead of having arbitrary type/kind equivalence rules, we check for type/kind equivalence at application time. For equivalence checking, we do *weak-head equivalence*, where we check equivalence between *weak-head normal forms*.

![[Screenshot 2024-07-23 at 2.28.53 PM.png]]

Weak-head normal form is a subset of beta reduction, where we only do beta reduction on the head of an expression:

-  $$\begin{prooftree} \AXC{$t_{1} \to_{wh} t_{1}'$} \UIC{$t_{1}\ t_{2} \to_{wh} t_{1}'\ t_{2}$} \end{prooftree}$$
- $$\begin{prooftree} (\lambda x:T_{1}. t_{1})\ t_{2} \to_{wh} [x \mapsto t_{2}]t_{1} \end{prooftree}$$

This is why the last two rules have "$s$/$t$ not a $\lambda$": by WHNF evaluation, they can't be!

We can show that the algorithm defined for type checking is sound (if it's in the algorithm, it typechecks), complete (the reverse), and terminates! We can also prove additional properties such as type-preservation under beta-redex.

## Dependent sum types

A dependent sum type $\Sigma_{x:T_{1}}\ T_{2}$ generalizes ordinary product types: $x$ can appear in $T_{2}$.

![[Screenshot 2024-07-23 at 2.38.58 PM.png]]

Some highlights:

- In terms, we add pairs and projection. In types, we add dependent sums.
- We add kinding rules for sums, as well as introduction and elimination typing rules
- For equivalence, we add projection and *surjective pairing*, a kind of eta rule for sigma-types: every pair can be formed with the pair constructor.

![[Screenshot 2024-07-23 at 2.43.08 PM.png]]

Algorithmic typing is straightforward, except we have to extend beta reduction and WHNF:

![[Screenshot 2024-07-23 at 2.43.34 PM.png]]

> [!note] An aside: "sum" and "product"
> One question you might have: why the fuck is a dependent product a function type, and a dependent sum a product type? Well, [this StackExchange post](https://cs.stackexchange.com/questions/81112/why-product-type-is-a-dependent-sum) has some insight for us.
> 
> Basically, 

# The calculus of constructions

> [!note] See also
> https://hbr.github.io/Lambda-Calculus/cc-tex/cc.pdf
> https://coq.inria.fr/doc/v8.9/refman/language/cic.html

So far, we've seen:

Let’s look back a lil at the different type systems and abstractions we’ve seen so far:

1. Abstraction of terms from terms: *functions* in **simply-typed lambda calculus (STLC)**
2. Abstraction of types from terms: *parametric polymorphism* in **System F**
3. Abstraction of terms from types: *dependent types* in **λLF**

But notice that in λLF, we're not able to define functions that take types as input, and return types as output. The **Calculus of Constructions** (CC) introduces abstractions from *types to types*! Introduced by Coquand and Huet (hence, Coq) as a setting for ==all of constructive mathematics==.

![[Screenshot 2024-07-23 at 2.45.12 PM.png]]

CC introduces a few key extensions:

- Two new types: **propositions** and **proofs**. A proposition has kind $*$, while a proof is a constructor $\Pi_{x:Prop}\ *$.
	- Elements of $Prop$ represent propositions and "datatypes" like `Nat`s.
	- Elements of $Prf\ (a : Prop)$ represent proofs—the inhabitants of the propositions and datatypes above.
- **Universal quantification**. It's added to the term language, but really, it acts on types.

$Prop$ and $Prf$ are ways to get types as terms—the terms that inhabit $Prop$ are themselves types, and the terms that inhabit $Prf\ p$ are values in $Prop$.

So what's the point of the universal quantification? It's a constructor for propositions. On its own, it and its body share the same type $Prop$, as given by the first rule. When we wrap this inside the $Prf$ type constructor, we get back a product type $\Pi_{x:T}\ Prf\ t$—a function that takes an element $x:T$ and returns a proof, or an inhabitant, of the proposition $t : Prop$. We can read the equivalence $Prf\ (\forall x:T. t) \equiv \Pi_{x:T}\ Prf\ t$ as:

> A proof that $t$ holds for all $x : T$ is *equivalent* to a function that takes a value $x : T$, and returns a proof that $t$ holds.

Because we have this now, we can define functions that interleave types ($p : Prop$) and their values ($v : Prf\ p$)!

As an example, let's **define** the type `nat`:

```
nat = all a:Prop. all z:Prf a. all s:Prf a -> Prf a. a
```

How do we define an inhabitant of this type? Remember that $Prf\ (\forall x:T. t) \equiv \Pi_{x:T}\ Prf\ t$. A proof of a bunch of foralls is just a dependent product that returns a proof of the last thing! Universal quantification lets us move between type-land and term-land!

```
zero : Prf nat
zero = λa:Prop. λz:Prf a. λs:Prf a -> Prf a. z
```

And now we have Church numerals.

Here's another way of looking at this; from a website on a [proposal for Dependent Haskell](https://serokell.io/blog/ghc-dependent-types-in-haskell), they proposed adding "visible forall" a while back:

```haskell
id' :: forall a -> a -> a
id' (type t) x = x :: t
```

This is that!

You can get existential quantification back from this, showing this is a superset of System F:

```
exists = λf:A -> Prop. all c:Prop. all m: (∏x:Prop. Prf (f x) -> Prf c). c
```

To be honest though, I don't even know what the fuck this means.

For beta reduction, we have the following:

![[Screenshot 2024-07-23 at 7.11.17 PM.png]]

And algorithmic formulation is as follows:

![[Screenshot 2024-07-23 at 7.11.37 PM.png]]

## The calculus of inductive constructions

Induction can't be proved with the impredicative encoding of datatypes. The **calculus of inductive constructions** combines CC with inductive definitions. Here, we can declare the type `nat : Prop` as an inductive type with constructors `zero : Prf nat` and `succ : Prf nat -> Prf nat`.

We can also define inductive type families, like `vector : Prf nat -> Prop`.

## Sigma types and universes

We can add sigma types (remember: dependent sums, the dependent version of tuples).

The **extended calculus of constructions** (ECC) contains sigma types and let's us do $\Pi_{}$ and $\Sigma_{}$ quantification over *kinds*. Now, we have an infinite universe of kinds (i.e., types): $*_{1}, *_{2}, \dots$ This is just type universes! `Type : Type 1 : Type 2 : ...`. In this system, we could say something like: $$ \Sigma_{X:*_{3}}\ X:*_{4} $$

> [!note] See also
> https://www.pls-lab.org/Extended_calculus_of_constructions

# Pure type systems

CC is expressive but difficult to understand. Given a lambda term $\lambda x: S. t$, it's hard to tell if this is a term-level function, type abstraction, type family, type operator, or something else.

To help, we introduce: **the lambda cube**. I'm not joking.

![[Screenshot 2024-07-23 at 7.26.49 PM.png]]

Here, we can see three axes of abstraction. $\lambda_{\to}$ is in the bottom left, representing only term-term abstraction. Moving rightwards, we add type-term abstraction (i.e., type families)—$\lambda P$ is the lambda cube's version of $\lambda LF$. Moving up, we add term-type abstraction, capturing polymorphism. And moving back, we add type-type abstractions.

Haskell is based on System $F^\omega$, and so has type operators, but not dependent types.

## Pure type systems

We can present all the type systems in the lambda cube in the *pure type system* framework. Here's an example where we define $\lambda P$ in PTS-style:

![[Screenshot 2024-07-23 at 7.36.03 PM.png]]

Things to note:

- In PTS, there are three syntactic categories: **terms**, **sorts**, and **contexts**.
- Sorts are used to distinguish categories of term.
- In λP specifically, there are two sorts: the sort of types (i.e., kinds) and the sort of kinds.
	- Instead of saying $\Gamma \vdash T :: *$, we say $\Gamma \vdash T : *$, denoting that $T$ is a type.
	- Instead of saying $\Gamma \vdash K$ for kind well-formedness, we say $\Gamma \vdash K : \square$, denoting that $K$ is a kind.
- The interesting part is pi type introduction.
	- $(s_{i}, s_{j})$ can be either $(*, *)$ or $(*, \square)$.
	- When it's the former, we get first order dependent product types, from a term to a term
	- When it's the latter, we get type families, from a term to a type.
- The conversion rule is defined between untyped terms.

We can recover all the lambda cube systems based on what values $(s_{i}, s_{j})$ can take on!

| System          | Term to term $(*, *)$ | Type families $(*, \square)$ | Polymorphism $(\square, *)$ | Type operators $(\square, \square)$ |
| --------------- | --------------------- | ---------------------------- | --------------------------- | ----------------------------------- |
| $\lambda_{\to}$ | ✓                     |                              |                             |                                     |
| $\lambda P$     | ✓                     | ✓                            |                             |                                     |
| $F$             | ✓                     |                              | ✓                           |                                     |
| $F^\omega$      | ✓                     |                              | ✓                           | ✓                                   |
| $CC$            | ✓                     | ✓                            | ✓                           | ✓                                   |
|                 |                       |                              |                             |                                     |
|                 |                       |                              |                             |                                     |

^e90dah

We can also adjust whether we include `Type : Type`, which means $*$ is sort of all types including itself. Thus, all types are inhabited and there are non-normalizing terms, making it logically meaningless (set contains set).

# Programming with dependent types

Most languages have general recursion, which would make equivalence (and thus typechecking) undecidable.

Alternatively, you could limit dependent types' expressivity, like Dependent ML (the precursor to ATS!) did. Here, dependency on terms is only allowed for certain *index sorts*, like integers. Thus, type families can only be of the form `int -> ...`. This is kind of like Rust's current limitations with const generics! You can only use numbers or whatever as const, not your own datatypes.

Additionally, we also allow for subset index sorting: `{a : int | a >= 0}`.

Typing rules are similar as with λLF, except that **index variables, abstractions, and applications are separate from term variables, abstractions, and applications**. In the syntax used in the book, this looks like:

```
nil  : Vector[0]
cons : ∏n:int. data -> Vector[n] -> Vector[n + 1]
```

There's special syntax for type family application, and arrows are no longer specializations of dependent product types, but their own separate things.

To do type equality checking, we now use **constraint solving**; it's no longer dependent on term equality. Constraint solving is decidable, which makes this decidable!