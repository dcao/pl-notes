---
aliases:
  - "TAPL 20, 22, 23, 24: Recursive, universal, and existential types"
tags:
  - reading
year: 2002
bookauthors:
  - Pierce, Benjamin C.
status: Todo
related:
  - "[[pierceTypesProgrammingLanguages2002]]"
itemType: bookSection
publisher: MIT Press
location: Cambridge, Mass
ISBN: 978-0-262-16209-8
scheduled: 2024-07-08
---
# § 20. Recursive types

Often when defining types, we want types to be able to refer to themselves. Consider the canonical linked list in Haskell:

```haskell
data List a = Nil | Cons a (List a)
```

It refers to itself! These are *recursive types*. In the textbook, they use an explicit recursion operator `µ` for types, so a `NatList` would be defined as follows:

```
NatList = µX. <nil:Unit, cons:{Nat,X}>;
```

where `X` basically represents `Self`. The definition is read: "Let `NatList` be the infinite type satisfying the equation `X = <nil:Unit, cons:{Nat,X}>`."

## Uses

An infinite list can be defined as the following type:

```
Stream = µA. Unit -> {Nat,A};
```

Constructing elements of this type can be done with the `fix` operator:

```
upfrom0 = fix (λf: Nat→Stream. λn:Nat. λ_:Unit. {n,f (succ n)}) 0;
```

We can generalize this as a `Process` that takes in number states as messages:

```
Process = µA. Nat -> {Nat, A}
```

Getting the current state of the process and sending new states to the process is defined as follows:

```
curr = λs:Process. (s 0).1;
send = λn:Nat. λs:Process. (s n).2;
```

We can represent objects in a purely functional way like this! Think `Self` type:

```
Counter = µS. {get:Nat, inc:Unit->S};
```

Definition is done through `fix`:

```
c = let create = fix (λf: {x:Nat}→Counter. λs: {x:Nat}.
                        {get = s.x,
                         inc = λ_:Unit. f {x=succ(s.x)},
                         dec = λ_:Unit. f {x=pred(s.x)} })
    in create {x=0};
```

The auxiliary definition `create`  is responsible for setting state.

## Well-typed fix

```
fixT = λf:T→T. (λx:(μA.A→T). f (x x)) (λx:(μA.A→T). f (x x));
```

The domain of `x` must be `x` itself. We can satisfy that here!

But with recursion, any expression can diverge:

```
fixT (λx:T. x)
```

## Typing rules: iso-recursive vs equi-recursive

There are two possible approaches to recursive types. Each of these differs in how they treat a type `µX.T` and its one-step unfolding. For instance, what's the relationship between `NatList` and `<nil:Unit, cons:{Nat,NatList}>`?

The **equi-recursive** approach treats these two things as definitionally equal. The only different that's required is that we need to allow type expressions to be infinite, and we can't do induction on type expressions.

The **iso-recursive** approach sees these types as different but isomorphic. In this approach, we must introduce new constructs that let us "witness this isomorphism" and translate between isomorphic types:

![[Screenshot 2024-07-08 at 6.56.55 PM.png]]

Here, the `unfold` operator goes one level deeper of replacement, while the `fold` operator undoes this substitution.

The equi-recursive approach is notationally lighter, but much harder to implement, since you basically have to infer `fold`/`unfold` annotations. Plus, interactions with other advanced features like bounded quantification and type operators can be complex and maybe undecidable.

The iso-recursive approach is the one most often used in practice; here, the annotations are "hidden" by making them be added automatically. For instance, in ML languages, a `datatype` definition implicitly introduces a recursive type. Constructors introduce a `fold`, while constructors in pattern matches introduce an `unfold`.

# § 22. Type reconstruction

We're starting to talk about polymorphism! Let's fucking go. In this chapter, we talk about **type reconstruction**: which can *infer* a *principal type* for each term.

## Type variables and substitutions

In this calculus, our uninterpreted base types are **type variables** that can be substituted or instantiated with other types. Type substitution consists of creating a *type substitution* $\sigma$ that maps from type variables to types, and applying this mapping to a type $T$ to yield a new instantiated type $\sigma T$.

$dom(\sigma)$ is the set of all type variables, and $range(\sigma)$ is the set of all types being mapped to. We can apply $\sigma$ to both types and terms. When applying it to terms, we just substitute out the type annotations in the term.

## Views on type-checking type variables.

Let's say $t : T$ mentions some type variables. There are two questions we can ask about the well-typedness of $t$:

1. Is $t$ well-typed for **all** possible type substitutions? $$\forall \sigma. \sigma \Gamma \vdash \sigma t : T$$
2. Is $t$ well-typed for **some** possible type substitution? $$ \exists \sigma. \sigma \Gamma \vdash \sigma t : T $$

If we're trying to look at question 1, then type variables should be held *abstract* during type-checking, which ensures that a well-typed term will behave properly no matter what types are substituted in at the end. This is **parametric polymorphism**, i.e., **generics**!

In the circumstance of question 2, the term $t$ pre-substitution might not even be well-typed. We're just concerned with figuring out if there is some possible substitution that could *make* it well-typed! For example:

```
λf:Y. λa:X. f (f a);
```

Treating `Y` and `X` as uninterpreted base types, this isn't well-typed as is, but if we can substitute in `X -> X` for `Y`, we can get:

```
λf:X→X. λa:X. f (f a);
```

Which is valid!

Trying to find *any* valid substitution of type variables is type reconstruction, i.e., type inference. Given a context $\Gamma$ and a term $t$, a *solution* for $(\Gamma, t)$ is a pair $(\sigma, T)$ such that $\sigma \Gamma \vdash \sigma t: T$.

## Constraint-based typing

This is an algorithm that, given a term $t$ and a context $\Gamma$, calculates a set of constraints—equations between type expressions (maybe involving type variables)—that must be satisfied by any solution for $(\Gamma, t)$. At a high level, instead of *checking* constraints, we *record* them as constraints on new stand-in type variables that we create. This allows us to return the most general possible type for the term. Then, we can do type inference by finding a substitution that satisfies these recorded constraints on our type variables, thus getting back concrete types.

For instance, if we see $t_{1}\ t_{2}$, with $t_{1} : T_{1}$ and $t_{2} : T_{2}$, instead of checking that $t_{1} : T_{2} \to U$ and returning $U$, we create a fresh type variable $X$, record the constraint $T_{1} = T_{2} \to X$, and return $X$ as the result. The resulting type will thus be the most general type possible, with constraints encoding most of the important information about what types should be where.

A **constraint set** $C$ is a set of equations $\{ S_{i} = T_{i} \mid i \in 1..n \}$. A substitution $\sigma$ *unifies* an equation $S = T$ if $\sigma T$ is *identical* to $\sigma S$. Unify as in "make them the same!" $\sigma$ can also unify (or *satisfy*) a whole constraint set.

The typing rules for the **constraint typing relation** $\Gamma \vdash t : T \mid_{\mathcal{X}} C$ encodes the algorithm for doing constraint-based typing. We now explicitly carry around a constraint set $C$, and this judgment is read as "$t$ has type $T$ in environment $\Gamma$ *whenever the constraints $C$ are satisfied.*" The subscript $\mid_{X}$ keeps track of the set of type variables $\mathcal{X}$ that are *introduced* in a given rule. We need to be able to talk about different sets of type variables (for instance, to ensure they are non-overlapping), and this notation lets us do that. For example, here's the rule for variable types:
$$ \begin{prooftree} \AXC{$x : T \in \Gamma$} \UIC{$\Gamma \vdash x : T \mid_{\varnothing} \{  \}$} \end{prooftree} $$
Here, the subscript is just the empty set, since this judgment doesn't introduce any new type variables.

The general intuition is that, given $t$ and $\Gamma$, we first check if $t$ is typable under $\Gamma$ by collecting all the constraints $C$ that must be satisfied for $t$ to have a type. To infer a type, we then find substitutions $\sigma$ that satisfy $C$. The actual process/algorithm of finding satisfying substitutions is called [[#Unification|unification]].

Here are all the type rules:

![[Screenshot 2024-07-08 at 7.38.49 PM.png]]

- `CT-Var`, `CT-Zero`, `CT-True`, and `CT-False` are straightforward.
- Function calls that would have enforced the type of their arguments (`CT-Succ`, `CT-Pred`, `CT-IsZero`) instead add a new constraint that whatever type the argument is, it should be a `Nat` or `Bool`.
- `CT-If` combines all of the constraints for the predicate and bodies, introducing new constraints that ensure that the predicate is a `Bool` and the bodies have the same type. Here we see the importance of having the subscript $\mid_{\mathcal{X}}$, since it allows us to make sure that there's no weird variable shadowing happening between constraints across different branches.
- Finally, `CT-App` is the only rule that introduces a new type variable. Since there's no existing type that refers to the result of the application—$T_{1}$ could be itself just a type variable, after all, this rule gives a brand new type variable to the result of the application, enforcing the constraint that $T_{1}$ is a function from the argument type of $t_{2}$ to our new variable $X$. All of the noise ensures that $\mathcal{X_{1}}$ and $\mathcal{X}_{2}$ are totally disjoint and don't mention any free variables in either of the type expressions, and that the new type variable $X$ isn't mentioned anywhere.
	- In practice, we would have a function that generates fresh type variables.

> [!danger] TODO
> There's a progress and preservation proof here. Induction on type judgments, etc.

## Unification

When you hear a "Hindley-Milner" type system, this is where that comes from: they came up with using *unification* to find the "best" solution. The best solution is the most "general" solution.

Let's formalize what we mean by that. A substitution $\sigma$ is **more general** (or *less specific*) than a substitution $\sigma'$, written $\sigma \sqsubseteq \sigma'$, if $\exists \gamma. \sigma' = \gamma \circ \sigma$. The **principal unifier** (or *most general unifier*) for a constraint set $C$ is a substitution $\sigma$ that satisfies $C$ and such that $\forall \sigma'. satisfies(C, \sigma') \implies \sigma \sqsubseteq \sigma'$.

In other words, the most general solution is the minimal substitution required to satisfy a constraint set, the substitution from which all other substitutions can (and must!) be built on.

Here's the algorithm!

```haskell
data TypeExpr = Var String | Arrow TypeExpr TypeExpr
data Constraint = Eq TypeExpr TypeExpr
data Subst = String :-> TypeExpr

compose :: [Subst] -> [Subst] -> [Subst]
notFreeIn :: String -> TypeExpr -> Bool

-- [Constraint] should be Set Constraint but I want pattern matching syntax!
unify :: [Constraint] -> Maybe [Subst]
-- If there are no constraints, the empty substitution satisfies
unify [] = Just []
unify ((Eq s t):cs) = case (s, t) of
    -- If the equation is already satisfied, don't need to add substitutions
	(s, t)     | s == t        <- unify cs
    -- If the equation is in the form X = blah, X must map to blah in our subst
	(Var x, t) | notFreeIn x t <- fmap (`comp` [x :-> t]) $ unify cs
	-- If the equation is in the form fuck = X, X must map to fuck in our subst
	(s, Var x) | notFreeIn x s <- fmap (`comp` [x :-> s]) $ unify cs
    -- If we have two arrow types, the parts before the arrows
    -- and the parts after should be equal
    (Arrow s1 s2, Arrow t1 t2) <- unify $ cs ++ [Eq s1 t1, Eq s2 t2]
    -- else, fail
    otherwise                  <- Nothing
```

The `notFreeIn` is an *occur check*, which prevents generating a cyclic substitution like `X :-> X -> X`, which we don't want (unless we allow recursive types).

This algorithm will always terminate, either failing if the constraint set is non-unifiable or returning the principal unifier for the expression.

## Principal types

A **principal solution** for $(\Gamma, t, S, C)$ is a solution $(\sigma, T)$ such that $\forall (\sigma', T')$, if $(\sigma', T')$ is a solution for $(\Gamma, t, S, C)$, then $\sigma \sqsubseteq \sigma'$. In this scenario, $T$ is the **principal type** of $t$ under $\Gamma$.

If we have principal types, we can build a type inference algorithm that's more incremental. Instead of generating all constraints and then solving them all, we can return a principal type at each step instead. Since these types are always principal, we never need to re-analyze a subterm.

## Implicit type annotations

With this machinery, we can now introduce the inferred-type lambda abstraction construct, typed as follows:
$$ \begin{prooftree} \AXC{$X \not\in \mathcal{X}$} \AXC{$\Gamma, x : X \vdash t_{1} : T \mid_{\mathcal{X}} C$} \BIC{$\Gamma \vdash \lambda x. t_{1} : X \to T \mid_{\mathcal{X} \cup \{ X \}} C$} \end{prooftree} $$
This introduces a new type variable $X$ at this point to stand in for the argument type. This is more expressive than just having unannotated abstractions be syntax sugar for an abstraction with a type variable, since if we copy an unannotated abstraction, we can give it a new variable each time.

## Let-polymorphism

**Polymorphism** means language mechanisms that allow reusing a single part of a program with different types in different contexts. **Let-polymorphism** is a simple form of this, introduced with ML (it's also called *ML-style polymorphism* for this reason). The motivating example is as follows:

```
let double = λf:X->X. λa:X. f(f(a)) in
let a = double (λx:Nat. succ (succ x)) 1 in
let b = double (λx:Bool. x) false in ...
```

In the expression for `a`, `double` is inferred to have type `(Nat -> Nat) -> Nat -> Nat`, which means it can no longer be used with b. Parametric polymorphism (i.e., generics) is the full answer here, but let-polymorphism is a simple modification that gets us part of the way there.

At a high level, the signature of `double` is telling us about the relationship between the types of the arguments of this function, but as of right now, our type system also enforces a relationship between the types of the arguments of `double` across different calls of the function. This is because the $X$ type variable is assumed to be the same across different uses, and we apply constraints on $X$ assuming that it has only one value across different uses. Instead, we want to associate a *different* variable $X$ for each use of `double`.

So how can we do this? Well, from [[pierceTAPL20222002#Implicit type annotations|the last section]], we have a mechanism for introducing fresh type variables whenever an abstraction is defined. But with our let binding type rule, we concretize a specific type for a let-bound variable (and thus a specific choice of type variable in `double`) when type-checking:

$$ \begin{prooftree} \AXC{$\Gamma \vdash t_{1} : T_{1}$} \AXC{$\Gamma, x : T_{1} \vdash t_{2} : T_{2}$} \BIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2}$} \end{prooftree} $$

Instead, we can substitute $x$ in the body, which avoids this issue and means that the lambda abstraction will be copied in each location, and thus will introduce new type variables each time:

$$ \begin{prooftree} \AXC{$\Gamma \vdash [x \mapsto t_{1}] t_{2} : T_{2}$} \UIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2}$} \end{prooftree} $$
$$ \begin{prooftree} \AXC{$\Gamma \vdash [x \mapsto t_{1}] t_{2} : T_{2} \mid_{\mathcal{X}} C$} \UIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2} \mid_{\mathcal{X}} C$} \end{prooftree} $$

### Type-checking let definitions

Now, this formulation has some issues. First, since we no longer type-check let-bound variable definitions, we can pass in something like `let x = bullshit in 5` and it'll still type-check, which we don't want. So we can add a premise to the let rule that ensures $t_{1}$ is well-typed:

$$ \begin{prooftree} \AXC{$\Gamma \vdash [x \mapsto t_{1}] t_{2} : T_{2}$} \AXC{$\Gamma \vdash t_{1} : T_{1}$} \BIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2}$} \end{prooftree} $$

Note that this is still different than the original let rule, since we're not including $x : T_{1}$ in the environment that we check $t_{2}$.

### Efficiency improvements

Another problem is that the let-bound variable definition is now type-checked on every occurrence of the variable—since we're substituting it directly into the expression—which can cause exponential blow-up since the right-hand side can itself contain let bindings. To avoid, this, languages use a different reformulation of these rules that's more efficient:

1. Use constraint typing to find type $S_{1}$ and constraint set $C_{1}$ for $t_{1}$.
2. Use unification to find the principal type $T_{1}$ of $t_{1}$.
3. *Generalize* the remaining type variables in $T_{1}$. $T_{1}$ is no longer a type, but a *type scheme*, representing the structure of a type with respect to universally quantified holes. $$ T_{1} = \forall X_{1}, \dots, X_{n}. T $$
4. Extend the context to record this type scheme for the bound variable $x$, and type-check $t_{2}$.
5. Whenever $x$ occurs in $t_{2}$, generate fresh type variables $Y_{1}, \dots, Y_n$ and use them to *instantiate* the type scheme for $T_{1}$, yielding $[X_{1} \mapsto Y_{1}, \dots, X_{n} \mapsto Y_{n}]T_{1}$, which becomes the type of $x$ in that use.

This is mostly linear, but can still exhibit exponential blowup if `let`s are nested in the right-hand sides of other `let`s.

> [!note] See also
> For more on doing constraint-based type checking and inference with generics-style polymorphism, see [[semantic analysis#Instantiation and generalization]].

### Side effects

Finally, side effects can fuck this up. For example:

```
let r = ref (λx. x) in
r := (λx:Nat. succ x);
(!r) true
```

In line 1, `r` is inferred to have type scheme $\forall X. \verb|Ref|\ (X \to X)$. Line 2 instantiates `r` to $\verb|Ref|\ (Nat \to Nat)$, while line 3 instantiates it as $\verb|Ref|\ (Bool \to Bool)$. Thus, this type-checks even though it will runtime error!

This is caused by a mismatch in types and semantics. In our typing rules, we basically create two copies of the `ref`, each of which is typed differently. But in our semantics, only one `ref` is ever allocated. In our typing rules, we immediately substitute the definition in the body, while in our semantics, we only do substitution after the let-bound var definition has been reduced to a value.

One way of fixing this is adjusting evaluation to immediately substitute: $$ \verb|let|\ x = t_{1}\ \verb|in|\ t_{2} \to [x \mapsto t_{1}] t_{2} $$
Under this evaluation system, our example works, but doesn't do what we would expect:

```
(ref (λx. x)) := (λx:Nat. succ x) in
(!(ref (λx. x))) true;
```

These lines no longer refer to the same `ref`, but instead create a brand new one every time.

The other option is to adjust typing, imposing the restriction that a `let`-binding can be treated polymorphically only if its right-hand side is a syntactic value. This is called the **value restriction**, and in practice it doesn't actually result in a significant reduction in flexibility.

## Notes

> The biggest success story in this arena is the elegant account of type reconstruction for record types proposed by Wand (1987) and further developed by Wand (1988, 1989b), Remy (1989, 1990; 1992a, 1992b, 1998), and many others. The idea is to introduce a new kind of variable, called a row variable, that ranges not over types but over entire “rows” of field labels and associated types. A simple form of equational unification is used solve constraint sets involving row variables. See Exercise 22.5.6. Garrigue (1994) and others have developed related methods for variant types. These techniques have been extended to general notions of type classes (Kaes, 1988; Wadler and Blott, 1989), constraint types (Odersky, Sulzmann, and Wehr, 1999), and qualified types (Jones, 1994b,a), which form the basis of Haskell’s system of type classes (Hall et al., 1996; Hudak et al., 1992; Thompson, 1999); similar ideas appear in Mercury (Somogyi, Henderson, and Conway, 1996) and Clean (Plasmeijer, 1998).

# § 23. Universal types

We looked at let-polymorphism before. Now, let's look at a more general form of polymorphism, in a more powerful calculus: **System F**. It's Haskell time!!!!!!

## Types of polymorphism

Before we get into this, let's describe what **polymorphism** means. There are many kinds of polymorphism:

- **Parametric polymorphism**: basically, generics. Instantiate type variables per use as needed.
	- **Impredicative polymorphism** (i.e., *first-class polymorphism*) is the most powerful form of this
	- **[[#Let-polymorphism|Let-polymorphism]]** (i.e., *ML-style polymorphism*) restricts polymorphism to top-level `let` bindings and disallows functions that take polymorphic values as arguments, in exchange for better type inference.
- **Ad-hoc polymorphism**: ...
- **Subtype polymorphism**: ...

## System F

System F introduces a few concepts to our lambda calculus:

- **Universal quantification**. At the type level, we explicitly introduce type variables as their own construct and not just an uninterpreted base type. We can also write types that do universal quantification over these type variables: $\lambda X. T$
- **Type abstraction and application**: there is a new *term* $\lambda X. t$ which introduces a fresh type variable that can be referred to in a term. Accordingly, there is a new application form $(\lambda X. t_{12})\ [T_{2}] \to [X \mapsto T_{2}] t_{12}$.
	- Type annotations are part of the term language, so we need to do this
	- As an example, `id = λX. λx:X. x;`
- **Contexts contain type variable bindings**. Now, a context can also contain a list of type variables, to ensure uniqueness etc.

The semantics and typing rules for System F are shown below:

![[Screenshot 2024-07-14 at 10.27.55 AM.png]]

Well-typed System F terms are normalizing (progress & preservation).

## Erasure, typability, and type reconstruction

A term `m` in untyped LC is *typable* if there is some well-typed term `t` such that `erase(t) = m`. The type reconstruction problem asks: given an untyped term `m`, can we find a well-typed term that erases to `m`. Type inference!

For System F, this is undecidable. Even if you only erase what type is applied in type application terms, it's still undecidable. There are a few strategies for recovering some inference abilities:

- *Local type inference*
- *Greedy type inference*: any type annotation can be skipped, replacing with a type variable. We do subtype checking until we see either $X <: T$ or $T <: X$, at which point we set $X = T$. This is simplest, but maybe not best. Lots of spooky action at a distance.
- *[[#Let-polymorphism|Let-polymorphism]]*
	- This is a special case of System F where type variables range over quantifier-free types (*monotypes*) and quantified types (*polytypes*, i.e., type schemes) can only appear on the right side of arrows
- *Rank-2 polymorphism*: a type is rank-2 if no path from its root to a $\forall$ quantifier passes to the left of $\geq 2$ arrows.
	- $(\forall X. X \to X) \to Nat$ is rank-2
	- $((\forall X. X \to X) \to Nat) \to Nat$ is not.

## Erasure & evaluation order

Right now, we have a **type-passing semantics**; when a polymorphic function meets a type argument, we substitute that type into the function body. This is a runtime evaluation thing.

Instead, we can have a **type-erasure semantics**, where types are first erased before untyped terms are interpreted or compiled.

There are some things we have to keep in mind with this semantics. For instance, erasing types from this expression:

```
let f = (λX. error) in 0;
```

and turning it into this:

```
let f = error in 0;
```

changes the semantics of the function. Thus, we just need to make sure deferred evaluation because of type lambdas is preserved in the erased form.

## Parametricity

A parametric type can restrict the definition of a function! `id`'s definition is kinda self-evident since there's only one thing you can do with an `a`: return it!

## Impredicativity

A definition (of a set or type) is *impredicative* if it involves a quantifier whose domain includes the thing being defined. For instance, in the type $T = \forall X. X \to X$, $X$ can include $T$ itself! In ML, the polymorphism is *predicative*

# § 24. Existential types

We've seen $\forall$ in types. What about $\exists$? They can be used to talk about data abstraction and info hiding!

We write existential types as $\{ \exists X, T \}$. There are two intuitions for understanding this type:

- The *logical intuition* that an inhabitant element of this type is a value of type $[X \mapsto S]T$ for *some* unknown $S$
- The *operational intuition* that an inhabitant element of this type is a *pair* `{*S, t}` of a type `S` and a term `t` of type $[X \mapsto S]T$.

We can interpret `{*S, t}` as a package or a module with a hidden representation type `S`  (i.e., a *witness type*), and a term `t`. Since from the type of this value, we only know that there exists some representation type $X$ that $T$ is represented in terms, we don't know exactly what that representation type is.

For example, if we have:

```
p = {*Nat, {a = 5, f = λx:Nat. succ(x)}}
```

This can be type $\{ \exists X, \{ a:X, f:X \to X \} \}$. However, any of those $X$ values could also be instantiated with $Nat$! The typing rule for existential introduction requires an explicit annotation be given: $$ \begin{prooftree} \AXC{$\Gamma \vdash t_{2} : [X \mapsto U]T_{2}$} \UIC{$\Gamma \vdash \{ *U, t_{2} \}\ \verb|as|\ \{ \exists X, T_{2} \}: \{ \exists X, T_{2} \}$} \end{prooftree} $$

Here's the full new rules for adding existential types to System F:

![[Screenshot 2024-07-17 at 9.48.55 PM.png]]

`T-Unpack` is interesting since when unpacking an existential type, it hides the specific implementation type used for packing. The type of the term `x` is given in terms of an abstract bound existential `X`, not a specific type like $Nat$ or something like that. In other words, the `X` is used to syntactically introduce the type variable, not to bind to the actual value of the type.

Additionally, $T_{2}$ cannot contain $X$ free, since it's not in the context of the conclusion of the rule.

## Data abstraction with existentials

Let's talk about **abstract data types** (ADTs). With ADTs, we can only interact with them using the operations defined on the ADT. Its concrete representation is made opaque to outside interactors. Here's a counter ADT:

```
ADT counter =
  type Counter
  representation Nat
  signature
    new : Counter,
    get : Counter -> Nat,
    inc : Counter -> Counter;

  operations
	new = 1,
	get = λi:Nat. i,
	inc = λi:Nat. succ(i)
```

We can translate this into existentials:

```
counterADT =
  {*{x:Nat},
   {new = {x = 1},
    get = λi:{x:Nat}. i.x,
    inc = λi:{x:Nat}. {x = succ(i.x)}}}
as
  {exists Counter, new:Counter, get:Counter -> Nat, inc:Counter -> Counter}
```

### Objects

To get objects, our ADT should have the following structure:

```
ADT = {exists X, {state:X, methods:{...}}}
```

