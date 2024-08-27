---
aliases:
  - "TAPL 8, 9, 11: Simply-typed lambda calculus"
tags:
  - reading
year: 2002
bookauthors:
  - Pierce, Benjamin C.
status: Todo
itemType: bookSection
publisher: MIT Press
location: Cambridge, Mass
ISBN: 978-0-262-16209-8
scheduled: 2024-06-18
related:
  - "[[pierceTypesProgrammingLanguages2002]]"
---
# § 8. Typed arithmetic expressions

![[Screenshot 2024-06-18 at 12.30.03 PM.png]]

Also recall:

![[pierceTAPL2002#^9c29eb]]

How can we figure out stuck terms (e.g., `pred false`) without evaluation? For one, we should distinguish between booleans (`Bool`) and natural numbers (`Nat`)!

## The typing relation

> [!definition]
> The typing relation $t : T$ means that $t$ has type $T$. This relation is defined using *inference rules*, like with evaluation.

- A term is *well-typed* if $\exists t. t : T$.
- The typing relations go from smaller to bigger, for instance:

$$
\begin{prooftree} \AXC{$t_{1} : Nat$} \UIC{$\verb|succ|\ t_{1} : Nat$} \end{prooftree}
$$
 - Inversely, we can derive lemmas that "invert" this relation, for instance, if `if t1 then t2 else t3 : R`, then the statements `t1 : Bool`, `t2, t3 : R` hold.
 - These are *generation lemmas* - they show how to calculate the types of terms!
 - These generation lemmas are what we use when building type-checkers are stuff. The derivation rules operate "backwards" to how a type-checker would operate.

- > "*statements* (aka *judgments*) are formal assertions about the typing of programs, *typing rules* are implications between statements, and *derivations* are deductions based on typing rules"
- **Uniqueness of types**: each term has at most one type, and one derivation.
 	- This is not true in the general case (e.g., subtyping)

Here are the typing rules for the arithmetic expr lang:

![[Screenshot 2024-06-18 at 1.58.05 PM.png]]

## Type safety = progress + preservation

> [!definition]
> What is type safety? Type safety is the property that *well-typed terms do not get stuck*. We do this basically via induction, using two steps:
>
> - **Progress**: A well-typed term is not stuck—it's either a value or can take an evaluation step
> - **Preservation** (aka *subject reduction*): If a well-typed term takes an evaluation step, the resulting term is also well-typed.
>  	- The resulting term doesn't necessarily need to have the same type (e.g., in subtyping), but for this example, it should.

To help with proofs, we define the **canonical forms** of our types—the well-typed values of these types. Think of these like the ADT definition:

```haskell
data Bool = True | False
data Nat = Z | Succ Nat
```

### Progress proof for arithmetic exprs

> [!info]- Eval rules
> ![[Screenshot 2024-06-18 at 2.05.08 PM.png]]
> ![[Screenshot 2024-06-18 at 2.04.46 PM.png]]

By the structure of the progress proof, let's assume that $t : T$. We want to show that $t$ is a value, or $\exists t'. t \to t'$.

We proceed with induction on the derivation of $t : T$. The last step of $t : T$'s derivation can be one of a number of possibilities:

- In T-True, T-False, and T-Zero, $t$ is a value, so we're done.
- For T-If, by the induction hypothesis, either $t_{1}$ is a value or $\exists t_{1}'. t_{1} \to t_{1}'$.
 	- If $t_{1}$ is a value, it must be one of the canonical forms for `Bool`, meaning either E-IfTrue or E-IfFalse applies.
 	- If $t_{1} \to t_{1}'$, E-If applies.
 	- In either case, an eval step exists.
- For T-Succ, by the induction hypothesis, $t_{1}$ is a value or can evaluate to $t_{1}'$.
 	- If it's a value, by the canonical forms lemma, `succ t1` is also a value (i.e., value by construction)
 	- Otherwise, E-Succ applies.
- For T-Pred, by the induction hypothesis, $t_{1}$ is a value or can evaluate to $t_{1}'$.
 	- If it's a value, by canonical forms lemma, it's either `0` (E-PredZero) or `succ nv1` (E-PredSucc)
 	- Otherwise, E-Pred applies.
- Same for T-IsZero.

### Preservation for arithmetic

Let $t : T$. We want to show if $t : T$ and $t \to t'$, then $t' : T$.

Again, we do induction on a derivation of $t : T$. We assume preservation holds for subderivations of the current derivation—at any point, if proving preservation involves looking at a subterm $s$ that is well-typed ($s : S$) and evaluates to $s \to s'$, we assume the induction hypothesis (preservation) holds for that term $s$. This works by structural induction—if you can show preservation holds for a term given its subterms, you can recurse all the way down to the base case. We do case analysis on the last step of the typing derivation.

- In T-True, `t = true` and `T = Bool`. It's already a value and there's no $t \to t'$, so it's true.
 	- Same reasoning applies for T-Zero.
- In T-If, since we know `if t1 then t2 else t3` has type $T$, we also must know that $t_{1} : Bool$ and $t_{2}, t_{3} : T$. Since we know that $t \to t'$, there are three possible evaluation rules that could apply at this point.
 	- If E-IfTrue applies, $t_{1} = true$ and $t' = t_{2}$. $t_{2} : T$ from the subderivation, so we're good.
 	- If E-If applies, $t_{1} \to t_{1}'$ and $t' = \verb|if|\ t_{1}'\ \verb|then|\ t_{2}\ \verb|else|\ t_{3}$. By the IH, $t_{1}' : Bool$. Then, by T-If, this whole expr $t' : T$.
- In T-Succ, there are two possibilities.
 	- If $t_{1}$ is already a value, $\verb|succ|\ t_{1}$ is a value too and there's no $t'$.
 	- Otherwise, E-Succ applies and $t_{1} \to t_{1}'$. From T-Succ we know that $t_{1} : Nat$, and by preservation IH this means $t_{1}' : Nat$. And by T-Succ this means that $\verb|succ|\ t_{1}' : Nat$.

> [!note]
> You don't need to do induction on typing derivations; you can do induction on *evaluation* derivations too!

- Note that while subject reduction holds, subject expansion doesn't always hold.
 	- Evaluation can "erase" ill-typed terms (see [here](https://en.wikipedia.org/wiki/Subject_reduction))
 	- For instance, `t = if true then 0 else false`.
 	- By E-IfTrue, `t' = 0`, and by canonical lemma, `t' : Nat`.
 	- But `t` is stuck!
- If you're doing big-step evaluation, swap out $t \to t'$ with $t \Downarrow t'$.
- If you have an explicit `wrong` term that is generated whenever you get stuck, progress must evaluate to a non-wrong term.
 	- e.g., ![[Screenshot 2024-06-18 at 2.39.20 PM.png]]

# § 9. Simply Typed Lambda-Calculus

We're gonna look at a version of lambda calculus augmented with primitive booleans and conditionals. We have two type constructors: booleans and arrow (functions).

## The Typing Relation

First, let's define the typing context stuff real quick.

> [!definition]
> A **typing context $\Gamma$** (aka *type environment*) is a sequence of variables and their types. The **comma operator** extends $\Gamma$ by adding a binding on the right. The empty context $\emptyset$ can be omitted.
>
> This context can be conceptualized as a set of pairs, and thus a function/relation (with a domain and range) from variables to types.

Let's look at the typing judgment for abstractions, T-Abs:
$$
\begin{prooftree} \AXC{$\Gamma, x:T_{1} \vdash t_{2}:T_{2}$} \UIC{$\Gamma \vdash \lambda x:T_{1}. t_{2}:T_{1} \to T_{2}$} \end{prooftree}
$$
This captures the intuitive statement: "if $t_{2}:T_{2}$ assuming that, among other things, $x:T_{1}$, then we know that the abstraction has type $T_{1} \to T_{2}$." One thing you might ask is why not format it like this:
$$
\begin{prooftree} \AXC{$x:T_{1}$} \AXC{$t_{2}:T_{2}$} \BIC{$\lambda x:T_{1}. t_{2}:T_{1} \to T_{2}$} \end{prooftree}
$$
We format it the first way because $t_{2}$'s type depends on $t_{1}$! They're not just independent clauses. $t_{2}$ references $x$, and needs to *assume* that in its evaluation/typing environment, $t_{2} : T_{1}$.

The other typing rules are straightforward.

![[Screenshot 2024-06-18 at 2.49.02 PM.png]]

## Properties of typing

These are the same lemmas we've seen before:

- **Inversion**: "if a term of this form is well-typed, its subterms must have types of these forms"
 	- e.g., if $t_{1}\ t_{2} : T_{12}$, then $t_{1} : T_{11} \to T_{12}$ and $t_{2} : T_{11}$.
 	- Reversing the direction of derivations.
- **Uniqueness**: In a given context $\Gamma$, a term $t$ with all free variables in $\Gamma$ must have at most one type.
- **Canonical forms**:
 	- Bools are true or false
 	- If $v : T_{1} \to T_{2}$, $v = \lambda x:T_{1}. t_{2}$.

## Progress for STLC

We only care about proving progress for **closed programs** with no free variables (i.e., empty context), since complete programs are always closed. Apparently the proof is similar to [[#Progress proof for arithmetic exprs]].

## Preservation for STLC

Proving preservation requires a few lemmas first:

- **Permutation**: you can reorder contexts.
- **Weakening**: if you have a judgment $\Gamma \vdash t : T$, you can add whatever variables you want to $\Gamma$ and this still holds.

We also show a more ambitious lemma:

- **Preservation under substitution**: we want to show that if $\Gamma, x : S \vdash t : T$ and $\Gamma \vdash s : S$, then $\Gamma \vdash [x \mapsto s]t : T$. ^1b85cb
 	- Let's do case analysis on the first judgment.
  		- In T-Var, $t$ must be a variable, since $\Gamma$ maps from variables to types.
   			- Either $t = x$, in which case we already know $\Gamma \vdash s : S$ from the assumptions
   			- Or not, in which case no substitution happens and we're fine.
  		- In T-Abs, we can assume $x \neq y$ and $y \not\in FV(s)$.
   			- $t = \lambda y:T_{2}. t_{1}$
   			- $T = T_{2} \to T_{1}$
   			- $\Gamma, x : S, y : T_{2} \vdash t_{1} : T_{1}$.
   			- We can show $\Gamma, y : T_{2} \vdash [x \mapsto s]t_{1}:T_{1}$ by the induction hypothesis
    				- We do this by weakening $\Gamma \vdash s : S$ to $\Gamma, y : T_{2} \vdash s : S$.
   			- Thus, by T-Abs, $\Gamma \vdash \lambda y:T_{2}. [x \mapsto s] t_{1} : T$.
   			- By definition of substitution, running the subst on the whole abstraction is the same as running the subst on its body if $x \neq y$. So we're good!
  		- etc.

Apparently showing preservation is similar to [[#Preservation for arithmetic]] at this point.

## The Curry-Howard correspondence

- The $\to$ type constructor has two kinds of typing rules:
 	- An **introduction rule** T-Abs showing how elements of this type can be *created*
 	- An **elimination rule** T-App showing how elements of this type can be *consumed*.

Proofs have very computational vibes!

- Proving $P$ means finding *concrete* evidence for $P$.
- Proving $P \implies Q$ means, if you're given this concrete evidence (i.e., a proof) of $P$, transforming it somehow into concrete evidence of $Q$.
- Proving $P \land Q$ means finding both $P$ and $Q$.

The **Curry-Howard correspondence** states as follows:

| Logic                       | PLs                                |
| --------------------------- | ---------------------------------- |
| propositions                | types                              |
| proposition $P \implies Q$  | type $P \to Q$                     |
| proposition $P \land Q$     | type $(P, Q)$                      |
| proof of proposition $P$    | term $t$ of type $P$               |
| proposition $P$ is provable | type $P$ is inhabited by some term |

^z7i5wb

Girard's linear logic led to linear type systems!

## Erasure and typability

Compilers normally check types at compile time, then erase them at runtime.

## Curry-style vs. Church-style

- In **Curry-style**, we can talk about evaluation of non-well-typed terms. Semantics is before typing.
- In **Church-style**, evaluation is only defined on well-typed terms. Typing before semantics.

# § 11. Simple Extensions

These extensions (almost) all introduce *derived forms*—syntax sugar!

## Base types

- Strings? Floats? Things with opaque inner workings.
- We consider these as **uninterpreted**, **unknown**, or **atomic** base types, in the set $\mathcal{A}$ with no primitive operations on them at all.
 	- i.e., can't (de)construct them like nats or anything like that.

## Unit type

We add a new constant value $() : ()$ and a derived form $t_{1};t_{2} \stackrel{\text{def}}{=} (\lambda x: (). t_{2})\ t_{1}$ where $x \not\in FV(t_{2})$.

### An aside on derived forms

With derived forms, we can either formalize them as new constructs, or as syntax sugar. To prove that something is a derived form (i.e., is basically syntax sugar), we define an **elaboration function** $e$ that transforms from a more complex language $E$ to a simpler language $I$. We then show that evaluation and typing both correspond:

- $t \to_{E} t'$ iff $e(t) \to_{I} e(t')$.
- $\Gamma \vdash^E t : T$ iff $\Gamma \vdash^I e(t) : T$.

## Ascription

Explicitly saying an expression has a type: `t as T`. Pretty simple.

![[Screenshot 2024-06-18 at 3.42.21 PM.png]]

## Let bindings

![[Screenshot 2024-06-18 at 3.44.45 PM.png]]

Straightforward. But expressing this as a derived form isn't so straightforward. Naively, we'd want to do this:
$$
\verb|let|\ x = t_{1}\ \verb|in|\ t_{2} \stackrel{\text{def}}{=} (\lambda x:T_{1}. t_{2})\ t_{1}
$$
But $T_{1}$ comes not from the syntax purely, but from the info from the typechecker! So really this isn't a transformation on terms, but on *typing derivations*. This derived form transforms a derivation involving `let` into one that uses abstraction and application:

![[Screenshot 2024-06-18 at 3.46.38 PM.png]]

We could define `let` as immediate substitution, but this changes eval order and erases ill-typed terms.

## Tuples & records

![[Screenshot 2024-06-18 at 3.48.26 PM.png]]

Make note of syntax mostly. Records are the same, except with explicit labels instead of numbered fields.

![[Screenshot 2024-06-18 at 3.49.50 PM.png]]

This defines a new `match` function to generate substitutions through pattern-matched records.

## Sums & variants

This is a binary sum type (e.g., `data Sum a b = Inl a | Inr b`):

![[Screenshot 2024-06-18 at 3.55.21 PM.png]]

However, sums don't satisfy uniqueness of types. In T-Inl, $inl\ t_{1}$ can have infinitely many types corresponding to different choices of $T_{2}$. We can solve this by either holding it indeterminate and making it concrete later on (type reconstruction), allowing all possible values of $T_{2}$ to be represented uniformly (i.e., subtyping), or forcing the programmer to ascribe everything lmao.

This is the fully general **variants**:

![[Screenshot 2024-06-18 at 3.58.38 PM.png]]

These are analogous to Haskell ADTs with some caveats (variants with one Unit arg don't need to mention that arg, no parameterized datatypes, no recursive datatypes)

## Recursion

> The intuition is that the higher-order function ff passed to fix is a generator for the iseven function: if ff is applied to a function ie that approximates the desired behavior of iseven up to some number n (that is, a function that returns correct results on inputs less than or equal to n), then it returns a better approximation to iseven—a function that returns correct results for inputs up to n + 2. Applying fix to this generator returns its fixed point—a function that gives the desired behavior for all inputs n.

`fix` can't be defined in STLC (and *no* non-terminating computation can be typed with only "simple" types). So we add it as an explicit construct:

![[Screenshot 2024-06-18 at 4.01.59 PM.png]]
