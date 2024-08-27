---
aliases:
  - "ATAPL 3: Effect types and region-based memory management"
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
We're looking at **effect type systems** as a *means* to **region-based memory management**. Effect types describe important effects of computation, while region-based memory management refers to arenas basically.

# Value flow by typing with labels

They talk about BL—basically $\lambda_{\to}$ with `fix`, bools, and call-by-value semantics. They then introduce TL, where values are *tagged* with a label variable $\rho_{i}$. We denote $\langle v \rangle_{\rho}$ as $v$ tagged with $\rho$, using the syntax `t at p`. The operation `t ! p'` returns back $v$ if $p$ matches $p'$, becoming stuck otherwise. Typing rules guarantee that stuckness never happens with well-typed terms.

![[Screenshot 2024-07-24 at 12.04.37 PM.png]]

We denote $t'$ a *completion* of $t$ if $t'$ with its tagging information erased—denoted $\lVert t' \rVert$—is equal to $t$. A *constructor/deconstructor completion* (or *con/decon completion*) is one where every value is tagged on creation, and untagged immediately before it is eliminated (i.e., right before function application or if condition evaluation).

This form can give us insight into where values flow into each other. For instance, with the following program:

![[Screenshot 2024-07-24 at 11.58.59 AM.png]]

How do we know where `fst` will be used? We can annotate explicitly!

![[Screenshot 2024-07-24 at 12.00.18 PM.png]]

Subscripts denote tag labels, superscripts denote untag operations.

## Correctness

Correctness of TL means evaluating TL terms gives the "same" results as evaluating their underlying BL-terms. This has two parts:

1. **Conditional correctness**: TL-terms produce same results as BL-terms unless they get stuck. Property of eval rules
2. **Soundness**: TL-terms don't get stuck. Progress & preservation.

> [!danger] TODO
> There's a proof here; I skipped it.

## Inference of value flow info

What if we don't want to manually annotate this? Can we infer value flow?

Yes, but there are infinitely many con/decon completions for a term. The most useless completion is where we assign every value the same label—any value can be used anywhere. We want the completion with the most distinct labels, since this gives us the most specific information. This is the **principal completion**—it is unique, and all other completions can be obtained with variable substitution. To infer, we do the following:

1. Start with a con/decon completion template where each label variable occurs once
2. To satisfy typing rules, we need a substitution for label variables.
3. This involves solving equational constraints between template labels
4. Finding and solving the set of constraints both take linear time.

## Labels as regions

A label is a memory region. We can add lexically-scoped regions as follows:

![[Screenshot 2024-07-24 at 12.08.44 PM.png]]

Things to note:

- E-New takes precedence, evaluating the term inside the lexical scope with respect to the region.
- Once evaluated, E-NewBeta replaces the region with a dummy value, modeling deallocation. This models the intuition that if the final evaluated term still holds a pointer into the region, outside of that region's scope, that value won't make any sense!
	- `(new p. x at p)` is invalid, since when we leave the scope, the region is deallocated, and `p` becomes dangling.
	- We model this by evaluating `(new p. x at p) -> p at INVALID`, since `p` has been deallocated.
- The semantics are: evaluate region, run item within scope, deallocate region.

This is **unsound**. $\verb|new|\ \rho. (x\ \verb|at|\ \rho)$ is well-typed.

# Effects

The form of the judgment is: $$ \Gamma \vdash t :^\varphi T $$
where:
- $\varphi$ is an **effect expression** (i.e., **effect**)
- ${}^\varphi T$ is an **effect type**

meaning: "Under $\Gamma$, evaluating term $t$ produces observable effect $\varphi$, yielding a value of type $T$."

In a call-by-name (lazy) language, a variable has type $x : {}^{\varphi}T$, since the variable might be an unevaluated thunk, and arrows have type ${}^{\varphi_{1}}T_{1} \to {}^{\varphi_{2}}T_{2}$. In call-by-value (strict), variables are just $x : T$, and arrow types have for $T_{1} \to {}^{\varphi}T_{2}$.

In region-land, our effects are sets of regions that are accessed!

![[Screenshot 2024-07-24 at 12.24.15 PM.png]]

Important notes:

- Region expressions yield *constraints on $\varphi$*.
- With lexical scoping, the expression as a whole cannot contain $\rho$, allowing us to codify at the type level the intuition of "this expression can't reference $\rho$ once the lexical scope returns"
- The arrow type can be read as: "if evaluating $t$ results in effect $\varphi_{2}$, evaluating the lambda expression as a whole yields effect $\varphi_{1}$."
- Our base bool values don't make any prescription on what set of effects they type-check under—it may produce any effect.

# Region-based memory management

Compile-time management of the heap, no GC required, by annotating which regions a pointer is allocated in With *region inference* we can even do this manually without annotations! Rust does a variation of this!!

A **region** is a sub-heap containing heap allocated values. The heap is divided into distinct regions.

![[Screenshot 2024-07-24 at 12.33.05 PM.png]]

Versus the tagged language, we have some changes:

- We've added **region abstraction**—we can now bind a region and pass it in as an argument.
	- This allows for *region polymorphism*.
	- Since we have lexical region allocation only, region parameters must outlive functions.
	- *Region polymorphic recursion* means that the body of a recursive function can use pass in regions to recursive invocations different than the ones passed to itself at the top.
- Untagging is *implicit*: see RE-RBeta and RE-Beta.
	- Untagging will get stuck if we try to untag with $\bullet$, since the rules require the place to be $\rho$, which is separate from $\bullet$ in the syntax.
	- Additionally, allocation at a non-existent region will get stuck for the same reason: see RE-Clos and RE-RClos.

Deallocated memory $\bullet$ can be reused. In other words, if $t_{\bullet}$ is a term with some deallocated values, and $t$ is constructed from $t_{\bullet}$ by replacing some of these with new values, if $t_{\bullet}$ doesn't get stuck, neither does $t$.

This satisfies conditional correctness.

# The Tofte-Talpin calculus & type system

The **Tofte-Talpin (TT) region language** is the full, original version of what we've been building to. One small difference with the calculus is that it only allows region abstraction in the definition of recursive functions:

```
letrec f[rho_i...](x) at rho = t1 in ...
```

One of the distinguishing factors about TT is that it has a type system at all! Back in our land, we adapt the TT language's type system to work with our own:

![[Screenshot 2024-07-24 at 12.56.39 PM.png]]

h o o h b o y. Let's go through this:

- We have type polymorphism like System F, but also **effect polymorphism** $\forall \epsilon. T$. This allows us to define functions that don't specifically hardcode the set of regions.
	- Map normally has type $\forall a, b. (a \to b) \to [a] \to [b]$
	- Taking into account regions: $\forall a, b. (a \to^\varphi b) \to ([a], \rho) \to^{\{ \rho, \rho' \} \cup \varphi} ([b], \rho')$
	- But that requires us to lock in to a specific selection of $\varphi$.
	- We can be polymorphic over that! $$ \forall a, b, \epsilon, (a \to^\epsilon b) \to ([a], \rho) \to^{\{ \rho, \rho' \} \cup \epsilon} ([b], \rho') $$

This system is **sound**: progress & preservation means well-typed programs don't get stuck.

We can add extensions, e.g., list datatypes! For lists, we enforce that all cons cells have same region.

# Region inference

Like [[pierceTAPL20222002#§ 22. Type reconstruction|type reconstruction]] (inference), but for regions! This broadly follows the template algorithm in [[#Inference of value flow info]].

We start with an optimistic assumption where we introduce new variables for everything—none of the effects or regions depend on each other. Let's say a function $m$ has type:

![[Screenshot 2024-07-25 at 12.13.39 PM.png]]

We then analyze the expression from the inside out, building a typing tree as we go. These typing judgments collect constraints on our effects.

![[Screenshot 2024-07-25 at 12.12.14 PM.png]]

This tree yields a proof of... something, depending on what we subsitute for $\varphi_{i}$. However, in this tree, $\varphi_{4}$ and $\varphi_{5}$ aren't mentioned in the conclusion, so they don't change what we're proving. Thus, we can remove mentions of them from our constraints.

These constraints imply that $\rho_{4} \in \varphi$ and $\rho_{5} \in \varphi$—they're in the final effect. However, they're not mentioned explicitly in the environment (see the sentence "where $\Gamma$ is..."). This means we can add a `new rho4, rho 5.` statement before this expression, making them invisible to the outside of the expression and dropping them from the constraint.

For any effects not connecting to the environment with subset constraints, we quantify over that effect.

We repeat this process until fixpoint.

# Alternatives

Lexical scoping for regions is still too limiting. For example, consider the recursive game of life:

![[Screenshot 2024-07-25 at 1.44.20 PM.png]]

We have some issues:

1. This isn't tail recursive anymore, cause we have to deallocate after returning
2. The `nextgen` function has to construct its result in the same region that contains its input: space leak!

How can we fix this?

## Region resetting in ML Kit

Adding the ability to allocate, but to remove all the items that were previously allocated in that region. We can infer when to do this with a local liveness analysis—we see if other values in that region are still live at this point. This works, but obscures the original algorithm and isn't obvious.

## Aiken-Fähndrich-Levien's analysis for early deallocation

Change: a region variable introduced by `new` can be unallocated or deallocated! Dataflow analysis for region variables introduces annotations indicating when a region should be allocated or deallocated.

## Imperative regions

Instead of lexical scope, `new` and `release` (i.e., deallocation) are statements!

## Cyclone

Rust is based on Cyclone's model! **Lifetimes**: region $\rho$ outlives region $\rho'$ if the *lifetime* of $\rho$ encompasses that of $\rho'$. We have region subtyping. Instead of effect variables, Cyclone introduces a `regions_of` operator, representing the region variables that occur free in a type. This operator is left abstract until the type variable is instantiated, thus emulating effect polymorphism! Here's the type of map: $$ \forall a, b. (a \to b) \to ([a], \rho) \to^{\{ \rho, \rho' \} \cup \verb|regions_of|(a \to b)} ([b], \rho') $$

## Other approaches

Regions with CPS, type system where region references can be stored in data structures in the presence of *linear types*.
