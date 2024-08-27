# Recursive types

```
data NatList = Nil | Cons Nat NatList
 ↓
NatList = µX. <nil:Unit, cons:{Nat, X}>
```

Uses:

- `Stream = µA. Unit -> {Nat, A}`; `Process = µA. Nat -> {Nat, A}` takes current state as input.
- `ClassWithSelf = µSelf. {get:Nat, inc:Unit -> Self}`; defn with `fix`
- Well-typed (but diverging) `fix`.

What's the relationship between `NatList` and `<nil:Unit, cons:{Nat, NatList}>`?

- **Equi-recursive**: definitionally equal. Conceptually simpler but bounded quantification and type operators are undecidable.
- **Iso-recursive**: isomorphic, but requires `fold [T]` (`<...> -> T`) and `unfold [T]` (`NatList -> <...>` with `X -> T`) operators. Can be inferred in practice, as it is in ML.

See [[pierceTAPL20222002#§ 20 Recursive types|TAPL §20]], [[2024-07-03 • denotational semantics and fancy types]].

# Type inference

Does there *exist* a **type substitution** $\sigma$ from type variables to types such that $\sigma \Gamma \vdash \sigma t : T$?

Our core algorithm has two parts.

- **Constraint-based typing**: during type-checking collect constraints on "these types must be equal" and only solve this after.
	- $\Gamma \vdash x : T \mid_{\mathcal{X}} C$: $x$ has type $T$ whenever the **constraint set** $C$ is satisfied. $\mathcal{X}$ is set of type variables introduced in rule, used to avoid overlapping variables.
	- e.g., $$ \begin{prooftree} \AXC{$\Gamma \vdash t_{1} : T \mid_{\mathcal{X}} C$} \UIC{$\Gamma \vdash \verb|succ|\ t_{1} : Nat \mid_{\mathcal{X}} C \cup \{ T = Nat \}$} \end{prooftree} $$
- **Unification**: an algorithm to solve constraints by finding **principal unifier**.
	- Principal unifier = valid type substitution that makes the least amount of assumptions possible. All other substitutions can be recovered from this one by adding more stuff.
	- $Ty = Ty$ is trivial.
	- $Var = Ty$ or $Ty = Var$ adds the substitution $Var \mapsto Ty$, 
	- $S_{1} \to S_{2} = T_{1} \to T_{2}$ requires unifying $S_{1} = T_{1}$ and $S_{2} = T_{2}$.
	- Anything else = fail.
	- The **principal type** of a term is the type of a term under the principal unifier.
- A type with variables is a **type scheme** (aka **polytype**), representing structure of type wrt universally quantified holes.
	- Do this to avoid type-checking entire type of let-bound variables on every occurrence.

Common pitfalls:

- ==Make sure you type-check unused let-bindings==!
	- **Let-polymorphism**: let bindings can have polymorphic (i.e., generic) types, instantiated with specific types at each use site.
	- The naive way to do this with our constraint setup ==doesn't check binding type==: $$ \begin{prooftree} \AXC{$\Gamma \vdash [x \mapsto t_{1}] t_{2} : T_{2} \mid_{\mathcal{X}} C$} \UIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2} \mid_{\mathcal{X}} C$} \end{prooftree} $$
	- Modify to ensure we type-check the binding, even if it isn't used: $$ \begin{prooftree} \AXC{$\Gamma \vdash [x \mapsto t_{1}] t_{2} : T_{2}$} \AXC{$\Gamma \vdash t_{1} : T_{1}$} \BIC{$\Gamma \vdash \verb|let|\ x=t_{1}\ \verb|in|\ t_{2} : T_{2}$} \end{prooftree} $$
- ==Let bindings and side effects can fuck things up==
	- Since we infer the most general type for a let binding, every use might instantiate it differently.
	- ==Instantiating a read and write of `Ref` with different types is fucked==
	- **Value restriction**: `let`-binding is only polymorphic if not binding to a `ref`.

See [[pierceTAPL20222002#§ 22 Type reconstruction|TAPL §22]], [[2024-07-03 • denotational semantics and fancy types]], [[semantic analysis]].

# Generics (parametric polymorphism) with System F

**System F** introduces **universally quantified types** $\lambda X. T$, introduced at the term level with type abstractions $\lambda X. t$ and eliminated with type application $(\lambda X. t) [T]$. Contexts can bind type variables now too: $\Gamma, X$. This is **type-term abstraction**.

- Above is **type-passing semantics**; we can also have **type-erasure semantics**: erase types, then evaluate
	- Results in different semantics: `let f = (λX. error) in 0; != let f = error in 0;`
- Polymorphism restricts definition: $\forall a. a \to a$ yields one possible function.
- A definition is **impredicative** if quantified variable could also include itself.
	- $T = \forall a. a \to a$; maybe $a = T$!

See [[pierceTAPL20222002#§ 23. Universal types|TAPL §23]], [[2024-07-03 • denotational semantics and fancy types]], [[semantic analysis]].

## Inference

- In general, type inference is **undecidable** with full System F.
	- You can solve this by limiting where polymorphism happens (let-polymorphism, rank-2 polymorphism means no $((\forall x. x \to x) \to a) \to a$)
- **Hindley-Milner type systems** give you both quantification and inference by **enforcing let-polymorphism**.
	- Let-bindings are always **polytypes** with universal quantification.
		- Polytypes are stored as **type schemes**, with holes where quantified variables go.
	- Expressions are **monotypes** with no quantification.
		- Upon use, a polytyped expression has its holes replaced with fresh type vars.
		- When bound, a monotyped expression has its type inferred, then type variables are replaced with holes.

See [[semantic analysis#Instantiation and generalization]], [[pierceTAPL20222002#Efficiency improvements|TAPL §22]].

## Existentials

$\{ \exists X, T \}$: inhabitant element of this type is value $\{ *S, t \}$ of type $t : [X \mapsto S]T$. Use this for ADTs, where $X$ is representation type, and $T$ is type of the record of class functions.

See [[pierceTAPL20222002#§ 24 Existential types|TAPL §24]].

# Dependent types

## λLF

- Types can depend on values: $\Pi_{n:Nat}\ data \to Vec\ n$
	- Additionally, we have kinds, the type of types. **Type families**: $Vec : Nat \to Type$
	- lambdas introduce pi types.
- Since types can be evaluated now, we need **equivalence**
	- Definitional equality: only include basic equalities that are obvious.
	- To actually implement this, convert to weak-head normal form (only beta-reduce head), check equivalence on WHNFs.
- A dependent sum type $\Sigma_{x:T_{1}}\ T_{2}$ generalizes ordinary product types: $x$ can appear in $T_{2}$.
- In Curry-Howard, dependent types get us from constructive, intuitionistic, or propositional logic to **first-order logic**, which has **universal quantification**.
	- A proof of $\forall x: Nat. x + 0 = x$ has type $\Pi_{x:Nat}\ x + 0 = x$

## Calculus of constructions

Introduce functions from types to types. We have $Prop : Type$, representing propositions and "datatypes" like `Nat`s, and $Prf : Prop \to Type$, an inhabitant of a $Prop$. Types as terms!

We introduce $Prop$ with `all x:T. t`. $Prf\ (\verb|all|\ x:T. t) \equiv \Pi_{x:T}\ Prf\ t$.

This is a pretty low-level representation of things. The **calculus of inductive constructions** gives us inductive (algebraic) data types.

## Lambda cube

Three axes:

- Terms to types (type families)
- Types to terms (polymorphism)
- Types to types (type operators)

![[pierceATAPLDependentTypes2005#^e90dah]]

A **pure type system** is a structure for doing typing of STLC-based languages with different kinds of abstractions. In a PTS, we have two *sorts*: proper types $*$ and kinds $\square$. Typing and kinding use the same operator ($:$). Our terms also include all possible type expressions: abstractions, dependent products, etc. Our rules for the type/kind of the dependent product term is generic to a choice of input/output sort. Based on what we choose, we can recover all the kinds of abstractions listed above.

See [[2024-07-24 • dependent & effect types]] ([[pierceATAPLDependentTypes2005|ATAPL 2: Dependent types]]).

# Effect types

- $\Gamma \vdash t :^\varphi T$ means "Under $\Gamma$, evaluating $t$ produces effect $\varphi$, yielding a $T$ value."
	- Effect types: ${}^{\varphi}T$. Lazy language: "evaluating this produces $\varphi$."
- Example: **region-based memory management**
	- Allocate values into different regions/arenas.
	- $\varphi$ is set of regions that are accessed. Typing produces constraints on $\varphi$.
		- Introduction: $$ \begin{prooftree} \AXC{$\Gamma \vdash t :^\varphi T$} \AXC{$p \in \varphi$} \BIC{$\Gamma \vdash t\ \verb|at|\ p :^\varphi T\ \verb|at|\ p$} \end{prooftree} $$
		- Elimination: $$ \begin{prooftree} \AXC{$\Gamma \vdash t :^\varphi T\ \verb|at|\ p$} \AXC{$p \in \varphi$} \BIC{$\Gamma \vdash t\ \verb|!|\ p :^\varphi T$} \end{prooftree} $$
		- Lexically scoped regions aren't visible outside scope: $$ \begin{prooftree} \AXC{$\Gamma \vdash t :^\varphi T$} \UIC{$\Gamma \vdash \verb|new|\ \rho. t :^{\varphi - \{ p \}} T$} \end{prooftree} $$
- To achieve deallocation of lexically scoped regions:
	- $$ \begin{prooftree} \AXC{$t_{1} \to t_{1}'$} \UIC{$\verb|new|\ \rho. t_{1} \to \verb|new|\ \rho. t_{1}'$} \end{prooftree} $$
	- $$ \begin{prooftree} \verb|new|\ \rho. v \to [\rho \mapsto \bullet]v \end{prooftree} $$
		- $\bullet$ is deallocated region.
- We can add *effect polymorphism* too. Allows us to not lock in specific selection of $\varphi$ for functions like `map`. $$ \forall a, b, \epsilon, (a \to^\epsilon b) \to ([a], \rho) \to^{\{ \rho, \rho' \} \cup \epsilon} ([b], \rho') $$
- Can do **region inference**, generalizing as much as possible, building type tree, adding lexically scoped regions to remove them from $\varphi$ from the outside world.

See [[2024-07-24 • dependent & effect types]] ([[pierceATAPLEffectTypes2005|ATAPL 3: Effect types and region-based memory management]]).