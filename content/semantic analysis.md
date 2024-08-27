---
aliases:
  - type checking
  - type inference
---
> [!note] See also
> The Stanford CS 164 [handout](https://web.stanford.edu/class/archive/cs/cs143/cs143.1128/handouts/180%20Semantic%20Analysis.pdf) and [lecture slides](https://web.stanford.edu/class/archive/cs/cs143/cs143.1128/lectures/08/Slides08.pdf) on semantic analysis provides a broad overview of what semantic analysis is. This top-level summary draws from this.

**Semantic analysis** is the process of ensuring that the program has a **well-defined meaning**. This program might be syntactically correct, but it is a *legal program*? Semantic analysis encompasses a number of different steps:

- Checking if a variable is declared before use in right scope.
- **Type-checking**. See [[pierceTAPL15182002|TAPL 15, 18: Subtyping & OOP]], [[pierceTAPL20222002|TAPL 20, 22, 23, 24: Recursive, universal, and existential types]].
- Disambiguate variables (symbol table mapping vars to unique ids, [[pierceTAPL2002#§ 6. de Brujin indices, briefly|de Brujin indices]], etc.).
- Checking for `public`/`private` access.

Some forms of semantic analysis can be performed *during parsing*; [[ahoDragonBookGrammars2007#^q2vl0y|attribute grammars]]. and syntax-directed translation in general, allow us to interleave program analysis into parsing. Most forms of semantic analysis operate on the AST of our programs.

# Hindley-Milner type checking & inference

> [!note] See also
> This section builds on the detailed treatment and explanation of *constraint-based* type inference in $\lambda_{\to}$ (i.e., no polymorphism) from [[pierceTAPL20222002#§ 22 Type reconstruction|TAPL §22]]. My [[2024-08-22 • Prelim review - type-checking and inference#Type inference|Prelim review notes]] of the section are a helpful summary.
> 
> This specific section takes from Tufts CS 105 lecture slides on Hindley-Milner type inference: [constraint solving](https://www.cs.tufts.edu/comp/105/schedule/lectures/lecture15/15-constraints.pdf) and [instantiating and generalizing polymorphic types](https://docs.google.com/presentation/d/1LjsM0k08Hc1aiTqyiY725WTQ86JBFUnhMGunzIyRvqw/edit#slide=id.gea8371cf6d_0_135)

> [!important] Other connections
> Keep in mind that the same equality constraint-based setup for doing type checking and inference here—i.e., **equality solving**—is also used in a bunch of other different domains (at least according to Federico):
> 
> - It's part of how **[[SAT and SMT solving]]** works!
> - It has some to do with e-graphs and **equality saturation** (see [[zhangBetterTogetherUnifying2023a|egglog]]), which has interactions between unification and union-find. In particular, an efficient way to store equivalences between sets of types, as we need to do here, is to use a union-find data structure, the same one that powers e-graphs! See [here](https://thunderseethe.dev/posts/unification/#union-find) for more.
> 
> The commonality is that we set up some system of (in)equalities that we want to solve, and we want to perform some kind of *unification* (in the general sense, not specifically unification-the-type-inference-algorithm) to figure out what's equal to what. In this case, we have equalities between types, which we solve with [[pierceTAPL20222002#Unification|Hindley & Milner's unification algorithm]].

At a high-level, real-world type checking and inference algorithms involve two steps:

- **Constraint generation**: building equality constraints between different types.
	- In inference, we might have *type variables* standing in for unknown types.
	- In `λx -> x + 1`, `x : a1` and `1 : Nat`.
	- Since `(+) : Num a => a -> a -> a`, we require the type equalities `Nat ~ a` and `a1 ~ a`.
- **Constraint solving**: figuring out a valid substitution for our type variables.
	- `a1 = Nat`

As described in [[pierceTAPL20222002|TAPL 20, 22, 23, 24: Recursive, universal, and existential types]], we can have polymorphic types, where we universally quantify over some type variable. This is generics! We distinguish between **monotypes**, which don't have quantification, and **polytypes** (or **type schemes**), which do have quantification.

In a Hindley-Milner type system, we have two rules for where polymorphic types can appear, basically amounting to [[pierceTAPL20222002#Let-polymorphism|let-polymorphism]]:

- Expressions must have monotypes.
	- If a polymorphic term is used in an expression, we must instantiate it to make it monomorphic.
- Things that are named (not including function arguments) must have polytypes. e.g., let bindings, function definitions, etc.
	- If we see a let-binding, *generalize* the inferred type to make it polymorphic.
	- In `let n = 3 in ...`, $n : \forall. Nat$ (i.e., type scheme with 0 vars)

## Constraint solving

Constraint solving is basically the same as is described in [[pierceTAPL20222002#§ 22 Type reconstruction|TAPL §22]]. The main difference here is that in a Hindley-Milner type system, the syntax for types is slightly different. In particular, we separate monotypes and polytypes, and monotypes can also be *type constructors*.

$$ \begin{aligned}
\tau &&&\text{monotypes:} \\
&= \alpha &&\text{variable} \\
&\mid C\ \tau_{1}, \dots, \tau_{n} &&\text{application} \\
\\
\sigma &&&\text{polytypes:} \\
&= \tau \\
&\mid \forall \alpha. \sigma &&\text{quantifier} \\
\end{aligned} $$

We unify as follows (the lectures further divide $\tau$ into type constructors):

![[Screenshot 2024-08-22 at 4.43.45 PM.png]]

## Instantiation and generalization

Because we have polytypes, we need to be able to **instantiate** them when used in expression position, and **generalize** expressions when they're name-bound, introducing $\forall$s wherever there are *unconstrained type variables*.

When we see a polytyped term in an expression, we need to instantiate the polytype. However, we don't actually need to add any constraints. Instead, we just generate fresh type variables to fill in all of our universally quantified holes. Later type-checking will then constrain these type variables with constraints.

$$ \begin{prooftree} \AXC{$\Gamma(x) = \forall \alpha_{1}, \dots \alpha_{n}. \tau$} \AXC{$\alpha_{1}', \dots, \alpha_{n}'$ fresh and distinct} \BIC{$\Gamma \vdash x : [\alpha_{1} \mapsto \alpha_{1}', \dots, \alpha_{n} \mapsto \alpha_{n}']\tau$} \end{prooftree} $$

Now, what if we want to let bind a monotyped expression $e : \tau$? The steps are:

- Infer a type for $e$: $\Gamma \vdash e : \tau \mid_{\mathcal{X}} C$.
	- This type may have some concrete types and some type variables.
- Replace type variables with quantification holes.

This is mentioned in [[pierceTAPL20222002#Efficiency improvements|TAPL §22]]! Steps 1-4 are generalization, step 5 is instantiation:

![[pierceTAPL20222002#Efficiency improvements]]

The slides write this out like so:

![[Screenshot 2024-08-22 at 5.07.33 PM.png]]