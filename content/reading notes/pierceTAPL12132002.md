---
aliases:
  - "TAPL 12, 13, 14: Normalization, references, and exceptions"
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
scheduled: 2024-06-25
---
# § 12. Normalization

> [!definition]
> A well-typed term is **normalizable** or **normalizing** iff it's guaranteed to halt in a finite number of steps.
> 
> This applies to the simple lambda calculus, but not for many extensions. Additionally, not all type systems are normalizable.

## Normalization for simple types

Let's look at STLC with one base type `A`.  How can we go about proving normalization?

Just doing induction won't work; if you try doing it the application rule `t1 t2`, with the IH stating that `t1` and `t2` are normalized to values `v1` and `v2`, this expression can expand into a bigger expression; we can't say in general that the term this application expands to is normalizable, since it might be bigger than the original term `t1 t2`.

To strengthen our IH, let's first define a set $R_{T}$ of closed terms (i.e., no free vars) of type $T$. $R_A(t)$ iff $t$ halts, and $R_{T_{1} \to T_{2}}(t)$ iff $t$ halts and $\forall s. R_{T_{1}}(s) \implies R_{T_{2}}(t\ s)$. Closed terms of base type can contain closed terms of functional type; we need to know not just that terms of functional type are themselves halting, but that when applied to halting arguments, they produce halting results. In other words, getting the function needs to halt, and applying the function also needs to yield a result that halts.

We want to show that all programs—closed terms of base type—halt. That is to say, $\forall t. R_{A}(t)$.

This is an example of a **logical relations** proof. To prove a property $P$ about all terms of type $A$, we do a kind of induction:

- Base case: show all terms of type $A$ *possess* property $P$.
- Inductive case: show all terms of type $A \to A$ preserve property $P$.
- Then, all terms of type $(A \to A) \to (A \to A)$ preserve property of preserving property $P$
- etc.

To do this, we define a family of predicates indexed on types—in this case, $R_{A}$. For the base type $A$, we just need to show $R_{A}$. For functions of type $a \to b$, we need to show that the function maps $a$ values satisfying the predicate to $b$ values that satisfy the predicate.

### The actual proof

Our proof then consists of three parts.

- First, we state that every element of $R_{T}$ is normalizable, which is trivial by definition.
- Next, we want to show that membership in $R_{T}$ is invariant under evaluation, i.e., if $t : T$ and $t \to t'$, then $R_{T}(t)$ iff $R_{T}(t')$.
	- Induction on structure of $T$.
	- Nothing to do if $T = A$.
	- If $T$ is an arrow type $T_{1} \to T_{2}$, there's more to do
		- We know $R_{T}(t)$ and $R_{T_{1}}(s)$ for some arbitrary $s$. We want to show $R_{T}(t')$.
		- By definition of $R_{T}$, we have $R_{T_{2}}(t\ s)$.
		- $t\ s \to t'\ s$, and from IH, we have $R_{T_{2}}(t'\ s)$.
		- And by definition of $R_{T}$, $R_{T}(t')$.
- Finally, we want to show every term of type $T$ belongs to $R_{T}$.
	- Induction on typing derivations.
	- In lambda abstraction abstraction case, we have $t = \lambda x : S_{1}. s_{2}$.
		- We would want to state $R_{S_{2}}(s_{2})$ by the induction hypothesis (subderivations), but $s_{2}$ isn't a closed term!
		- The solution is just to be like "for all possible substitutions for all vars in the environment of $s_{2}$": ![[Screenshot 2024-06-25 at 2.46.05 PM.png]]

# § 13. References

In which we start looking at language features involving **computational effects** (i.e., side effects).

So what are references? Well, they're basically C pointers, Java object pointers, or Rust `Box`es. A reference is a pointer to some location or cell in memory. We define an assignment operator (returning `()`) that mutates the value of that memory cell.

```
r = ref 5;      => 
!r              => 5
r := 7          => ()
!r              => 7
r := succ (!r)  => ()
!r              => 8
```

Multiple references can be *[[sridharanAliasAnalysisObjectOriented2013|aliases]]* for the same cell:

```
r = ref 5;
s = r;
s := succ (!s)
!r               => 6
```

We can have references to functions (boxed functions). For instance, you can define an array of numbers as a `Ref (Nat -> Nat)`. In-place updating the array is assigning a new function to the ref that returns the newly inserted value for the newly mentioned key, and calls the old function at the reference otherwise.

## Surface syntax typing

Is straightforward. `ref t1 : Ref T1`, `!t1 : T1`, assignment has type `()`.

## Evaluation

This is where things get spicy! We need to model "allocate storage and return a reference to this storage that can be mutated" in our operational semantics.

The answer is to model the heap as a map from an uninterpreted set of *store locations* $\mathcal{L}$ to values. For our notation, the metavariable $\mu$ denotes some arbitrary store. A reference then is modeled as a location $l \in \mathcal{L}$.

Evaluation depends on a store and can return an updated store. Thus, single-step evaluation is now $t \mid u \to t' \mid u'$. This is shown in our updated eval rules:

![[Screenshot 2024-06-25 at 3.12.00 PM.png]]

Function application itself has no side effects, and in the other cases we propagate side effects.

Values (and thus terms, since *all values are terms*) include a store location `l`. This doesn't mean the surface syntax should involve explicitly using store locations; this term language is an IR basically.

So let's formalize evaluation.

First, dereferencing a term `!t1` means evaluating `t1` until it becomes a value. $$ \begin{prooftree} \AXC{$t_{1} \mid \mu \to t_{1}' \mid \mu'$} \UIC{$!t_{1} \mid \mu \to !t_{1}' \mid \mu'$} \end{prooftree} $$
Then, dereferencing is just getting the value from the store. $$ \begin{prooftree} \AXC{$\mu(l) = v$} \UIC{$!l \mid \mu \to v \mid \mu$} \end{prooftree} $$
Next, evaluating an assignment expression `t1 := t2` means evaluating both sides until they become values.
$$ \begin{prooftree} \AXC{$t_{1} \mid \mu \to t_{1}' \mid \mu'$} \UIC{$t_{1} := t_{2} \mid \mu \to t_{1}' := t_{2} \mid \mu'$} \end{prooftree} $$
$$ \begin{prooftree} \AXC{$t_{2} \mid \mu \to t_{2}' \mid \mu'$} \UIC{$v_{1} := t_{2} \mid \mu \to v_{1} := t_{2}' \mid \mu'$} \end{prooftree} $$
Assignment just means mutating the store (when we prove type safety, we will show that $v_{1}$ must always be a location). $$ v_{1} := v_{2} \mid \mu \to () \mid [v_{1} \mapsto v_{2}]\mu $$
To evaluate creation of references, we first require that `ref t1`'s `t1` is fully evaluated. Then: $$ \begin{prooftree} \AXC{$l \not\in dom(\mu)$} \UIC{$\verb|ref|\ v_{1} \mid \mu \to l \mid (\mu, l \mapsto v_{1})$} \end{prooftree} $$
## Location and store typing

So now that we have locations in the mix, what's the type of that? The most obvious answer would be to do something like this:

> [!danger] Naive rule
> $$ \begin{prooftree} \AXC{$\Gamma \mid \mu \vdash \mu(l) : T_{1}$} \UIC{$\Gamma \mid \mu \vdash l : \verb|Ref|\ T_{1}$} \end{prooftree} $$

This intuitively makes sense; given the store as additional context, the type of a location is `Ref T1`, where `T1` is the type of whatever `l` points to in the store.

However, this definition actually sucks for two reasons:

- **It makes type checking hard**. Finding the type of $l$ requires finding the type of the value it points to *every time it's mentioned*. If this value itself contains locations, those locations will also have to have their value types recalculated on every mention
- **It makes cyclic references impossible to type-check**. $l_{2}$ has no finite type derivation given store $(l_{1} \mapsto \lambda x:Nat. (!l_{2})\ x, l_{2} \mapsto \lambda x:Nat. (!l_{1})\ x)$, since finding the type of $l_{2}$ means finding the type of $l_{1}$, which depends on $l_{2}$.

Intuitively, we know that when we create a location, that location will only ever have one type. If you create a `ref 5`, you can't assign `true` to it later on! So instead, we create a **store typing** function $\Sigma$ that maps locations to types. Now, we can reformulate store typings as so:

$$ \begin{prooftree} \AXC{$\Sigma(l) = T_{1}$} \UIC{$\Gamma \mid \Sigma \vdash l : \verb|Ref|\ T_{1}$} \end{prooftree} $$

Notice that the store typing isn't in the context at the top. Unlike the first rule, which says "given $\mu$ as our context, this type judgment holds," here our rule is "given a store typing directly, we $l$ has this type under the context of that store typing."

The typing rules from [[#Surface syntax typing]] remain unchanged; we just also thread in $\Sigma$. We don't explicitly assign to it or use it, since unlike with locations, we can get appropriate type information from other clues (i.e., type of the terms written in syntax):

![[Screenshot 2024-06-25 at 3.44.22 PM.png]]

> [!note]
> Alternatively, you could imagine `ref` as a syntax sugar maybe?

## Safety (and mostly preservation)

Progress (closed, well-typed terms are either values or have an eval step available) is somewhat straightforward; just extend induction on typing derivations. Preservation is where the real sauce is!

First, we need to explicitly tie a store $\mu$ with a store typing $\Sigma$. A store $\mu$ is *well-typed* with respect to a typing context $\Gamma$ and a store typing $\Sigma$, written $\Gamma \mid \Sigma \vdash \mu$, if $dom(\mu) = dom(\Sigma)$ and $\forall l \in dom(\mu). \Gamma \mid \Sigma \vdash \mu(l) : \Sigma(l)$. In other words, every value in the store should have the correct value predicted by the store typing.

Remember that preservation means if a well-typed term takes an evaluation step, the new term is also well-typed. Since we have a store to deal with, we must also assert the well-typedness of the store before and after too. Thus, we want to show:

$$ (\Gamma \mid \Sigma \vdash t : T) \land (\Gamma \mid \Sigma \vdash \mu) \land (t \mid \mu \to t' \mid m') \implies (\Gamma \mid \Sigma' \vdash t' : T) \land (\Gamma \mid \Sigma' \vdash \mu') $$

For the proof, we first show preservation under substitution (done in the same way as with [[pierceTAPL11Simplytyped2002#^1b85cb|STLC]]): $$(\Gamma, x : S \mid \Sigma \vdash t : T) \land (\Gamma \mid \Sigma \vdash s : S) \implies \Gamma \mid \Sigma \vdash [x \mapsto s]t : T$$
We also show that replacing the contents of a cell in a store with a new value of correct type doesn't change the type of the store:

![[Screenshot 2024-06-25 at 3.59.34 PM.png]]

Finally, we include a "store weakening" lemma that states that if a store is extended with a new location, the extended store covers everything the original does. Shown by induction.

With all these, we can show preservation.

# § 14. Exceptions

How can we model exceptions in our language?

## Abort immediately

First, the simplest kind of exception: give up immediately.

![[Screenshot 2024-06-25 at 4.04.46 PM.png]]

In this formalization, errors are terms but not values. This means there's no ambiguity in evaluating an expr like $(\lambda x:Nat. 0)\ \verb|error|$; this always returns error. The typing rule for `error` means we no longer have uniqueness; we can alleviate this through either subtyping or parametric polymorphism.

When showing progress, we now want to show that an expr becomes either a value *or* error.

## try-catch

![[Screenshot 2024-06-25 at 4.10.52 PM.png]]

## exceptions with values

![[Screenshot 2024-06-25 at 4.11.18 PM.png]]