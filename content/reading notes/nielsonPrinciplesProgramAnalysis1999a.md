---
aliases:
  - "Principles of Program Analysis 3: Constraint-based analysis"
  - control flow analysis
tags:
  - reading
year: 1999
bookauthors:
  - Nielson, Flemming
  - Nielson, Hanne Riis
  - Hankin, Chris
status: Todo
source: http://link.springer.com/10.1007/978-3-662-03811-6
related:
  - "[[nielsonPrinciplesProgramAnalysis1999]]"
itemType: bookSection
publisher: Springer Berlin Heidelberg
location: Berlin, Heidelberg
ISBN: 978-3-642-08474-4 978-3-662-03811-6
scheduled: 2024-07-26
---
> [!summary]
> In application, ==argument flows to parameter== & ==abstraction body value flows to application==

> [!note] See also
> While nominally notes for the relevant PoPA chapter, this also incorporates explanations from [these lecture notes from Jonathan Aldrich](https://www.cs.cmu.edu/~aldrich/courses/15-819O-13sp/resources/cfa.pdf), [these Harvard lecture slides](https://groups.seas.harvard.edu/courses/cs252/2011sp/slides/Lec10-CFA.pdf), and [this page from Matt Might](https://matt.might.net/articles/implementation-of-kcfa-and-0cfa/).

# Who cares?

With imperative programs, we can compile down to a control-flow graph and perform *dataflow analysis* on these graphs. However, when examining functional programs, this isn't so obvious:

1. There's no clear notion of a "program point" with obvious predecessors or successors
2. Computation is intrinsically nested
3. Since functions are first-class, dispatch can be dynamic—the body of a function can transfer control to an arbitrary function passed in as an argument.

**Control flow analysis** is a form of program analysis, like dataflow analysis, that is more well-suited to performing analyses like constant propagation on functional languages. One property of control flow analysis is that along with recording the information we care about, we also record the possible functions every subexpression could evaluate into. This info is needed for performing analyses in the presence of first-class functions, since whenever we have a function application, we need to know what functions might be applied at that point (i.e., where control flow might be coming from or to).

This analysis is also called **constraint-based analysis** since it relies on the generation of constraints on analysis values for variables and expressions.

# 0-CFA analyses

> [!note]
> This exposition follows with both the Aldrich lecture notes and the textbook presentation. We'll be switching back and forth where needed.

In this section, we're going to build up to a *constant propagation* analysis on a functional language. We'll get there eventually, but we'll work up to it!

Now of course, we want to record analysis values for variables, but since functional languages rely on expressions, we also want to record analysis values for *expressions* as well. We do this by associating each expression with a label $l \in Lab$. Our analysis $\sigma$ thus maps from either a variable $v \in Var$ or a label $l \in Lab$ to a [[lattice]] value $L$, which is the output type of our analysis:
$$
\sigma \in Var \cup Lab \to L
$$

> [!note] Textbook difference
> The textbook separates $\sigma$ into two components: an abstract environment $\hat{\rho}$, which has type $\widehat{\mathrm{Env}} = Var \to L$ and abstracts over execution environments, and $\hat{C}$, which has type $\widehat{\mathrm{Cache}} = Lab \to L$ an abstracts over execution *profiles*—traces of executed expressions. Additionally, instead of $L$, they use $\widehat{\mathrm{Val}} = \mathcal{P}(\mathrm{Term})$.
>
> Additionally, you could get away with having an analysis just be from $Var \to L$ if you transform to [[continuation-passing style]] or [[flanaganEssenceCompilingContinuations1993|A-normal form]], since all expressions become "labeled" by variables. We don't do that here to show that this sort of analysis doesn't require a transformation into e.g., CPS to work.

$L$ is the *abstract domain* of the analysis.

Before we get to a full constant propagation analysis, we're gonna do a simpler analysis that this analysis depends on: figuring out what functions an expression can call! The values a function could return (and thus what constants an expression could evaluate to) depends on the functions it is transferring control flow to, and the arguments given to those functions.

In **control flow analysis**, at every occurrence of a function application, we want to be able to know what functions we might be calling at that point. In other words, whenever we see $f(x)$, we want to know: what values could $f$ take on? We do this by associating every subexpression with a *set of possible functions* that the subexpression could take on. Thus, for now, our lattice type is:
$$
L = \mathcal{P}(\lambda x. e)
$$

So, how can we define this analysis? We define this analysis in terms of **constraints** over the possible analysis values for a variable or label. We then solve the constraints afterwards to get the most precise analysis value at each point.

In the Aldrich lecture notes, this analysis is given as **inference rules** that generate constraints. For instance, this rule states that a constant expression $n$ with label $l$ (remember—all expressions are labeled!) yields ($\hookrightarrow$) no constraints:

> [!note] Aldrich
>
$$
\begin{prooftree} \AXC{} \UIC{$[\![n]\!]^l \hookrightarrow \varnothing$} \end{prooftree}
$$

Equivalently, the textbook defines an **acceptability relation** $(\hat{C}, \hat{\rho}) \models e$, which states that $(\hat{C}, \hat{\rho})$ is an *acceptable* control flow analysis of the expression $e$. To define our constraints, we state under what conditions this relation holds. Here is the constant acceptability relation:

> [!note] Textbook
>
$$
(\hat{C}, \hat{\rho}) \models c^l \text{ always}
$$

Now, let's look at the how both treatments deal with the rule for variables. The rule broadly states that for a variable $x^l$, we need to check if the analysis value for $x$ is a subset of (in lattice-land, smaller than) that of $l$:

> [!note] Aldrich
>
$$
\begin{prooftree} \AXC{} \UIC{$[\![x]\!]^l \hookrightarrow \sigma(x) \sqsubseteq \sigma(l)$} \end{prooftree}
$$

> [!note] Textbook
> Note that at this point, they're specializing for the set analysis, and aren't thinking about lattices:
$$
(\hat{C}, \hat{\rho}) \models x^l \iff \hat{\rho}(x) \subseteq \hat{C}(l)
$$
>
> Since you've probably gotten a flavor for translating between Aldrich and the textbook, I'll be using the textbook's syntax from now on, since it's more standard I guess.

When we encounter a function, it's pretty straight-forward: we add a constraint that our analysis should include the fact that "this expression could evaluate to this lambda term":

> [!note] Textbook
>
$$
(\hat{C}, \hat{\rho}) \models (\lambda x. t)^l \iff \{ (\lambda x. t^{l}) \} \subseteq \hat{C}(l)
$$

Note that this definition doesn't demand that we analyze the body of the function at all. Instead, we do this analysis at function application, since we don't care about unreachable expressions.

Function application is more complex. Let's say we have an application $(e_{1}^{l_{1}}\ e_{2}^{l_{2}})^l$. Our analysis needs to check a few things:

- We must have valid analyses at $l_{1}$ and $l_{2}$.
- For every function $\lambda x. t^{l_{0}}$ in the analysis set for $l_{1}$ (i.e., the first expression):
 	- We must have a valid analysis at the body of the function $l_{0}$, **and**
 	- The possible set of functions that *formal parameter $x$ in the lambda* could evaluate to must include the possible set of functions stood for by the argument $l_{2}$, **and**
 	- The set of function values this application can take on must include the values of the body of the function $l_{0}$.

> [!note] Textbook
>
$$
(\hat{C}, \hat{\rho}) \models (e_{1}^{l_{1}}\ e_{2}^{l_{2}})^l \iff (\hat{C}, \hat{\rho}) \models e_{1}^{l_{1}} \land (\hat{C}, \hat{\rho}) \models e_{2}^{l_{2}} \land \forall (\lambda x. t^{l_{0}}) \in \hat{C}(l_{1}). (\hat{C}, \hat{\rho}) \models t^{l_{0}} \land \hat{C}(l_{2}) \subseteq \hat{\rho}(x) \land \hat{C}(l_{0}) \subseteq \hat{C}(l)
$$

## Constraint flow rule-of-thumb

We can summarize the way that constraints flow thusly: **the argument flows to the parameter**, and **the abstraction body flows to the application**. Consider an application $((\lambda v. t^b)(e^l))^a$

- The argument flows to the parameter means that $l$ flows to $v$. That is, the analysis for $l$ must be a subset of the analysis for $v$. $\hat{C}(l) \subseteq \hat{\rho}(v)$.
 	- Whatever analysis that holds for the argument must also hold for the parameter, since when the function is called, the parameter takes on *at least* that argument as its value.
 	- The parameter could take on other arguments in other places, hence why it's argument subset parameter and not other way around.
- The body flows to the application means that $b$ flows to $a$. The analysis for $b$ must be a subset of the analysis for $a$. $\hat{C}(b) \subseteq \hat{C}(a)$
 	- Function application will eventually yield $t^b$, the body of the abstraction.
 	- The analysis for $b$ will take into account all the possible concrete values of the parameter.
 	- Thus, the analysis for $b$ should also hold for $a$, which provides one possible concrete value of the parameter.
 	- This is an over-approximate analysis, since it assumes the analysis for $b$, which is taken assuming that $v$ could take on all sorts of values at different application points, is a *subset* of the analysis for $a$.
 	- But this is the safe, conservative estimate!

In general, we can say that **concrete values flow to abstract variables**. Application arguments flow to formal parameters, and concrete return values or function bodies flow to the variables they're assigned to.

==Remember this rule of thumb==. It will apply in general to the modifications of 0-CFA we will explore shortly.

## Sensitivities and polyvariance

> [!note] See also
> <https://en.wikipedia.org/wiki/Data-flow_analysis#Sensitivities>

This analysis has a number of properties:

- It is **flow-insensitive**: if we have an application $(e_{1}^{l_{1}}\ e_{2}^{l_{2}})$, even if our analysis of $l_{1}$ is empty (i.e., it can't take on any lambda values), we still perform analysis of $l_{2}$ anyways. ^70155c
 	- A *flow-sensitive* analysis would skip analyzing $l_{2}$ if it determines $l_{1}$ to be empty.
 	- This is because call-by-value (i.e., strict) semantics insists on a left-to-right calling order, which means that a flow-sensitive analysis—an analysis that takes into account order of execution and control flow—should analyze $l_{1}$ first and use that to inform whether it should analyze $l_{2}$.
 	- By contrast, our *flow-insensitive* analysis ignores the semantics of our language, and analyzes both $l_{1}$ and $l_{2}$ regardless.
 	- See the notes for ==Exercise== 3.3 on page 204 of the textbook.
- It is **path-insensitive**: when we encounter conditionals, the analysis for each branch doesn't depend on or incorporate information about the predicate expression of the conditional.
 	- From Wikipedia: "A **path-sensitive** analysis computes different pieces of analysis information dependent on the predicates at conditional branch instructions. For instance, if a branch contains a condition `x>0`, then on the *fall-through* path, the analysis would assume that `x<=0` and on the target of the branch it would assume that indeed `x>0` holds."
- It is **context-insensitive**: the analysis treats all function calls to the same function the same, regardless of where that function is being called. We'll go over this in depth in [[#Context sensitivity k-CFAs and m-CFAs]].
 	- Note that **monovariance** is another word for context insensitivity, and **polyvariance** is another term for context sensitivity.
 
> [!note] On flow- and context-sensitivity and -insensitivity
> [[sridharanAliasAnalysisObjectOriented2013|Alias Analysis for Object-Oriented Programs]] provides a more detailed look at flow-sensitivity & -insensitivity and context-sensitivity & -insensitivity.

# Adding dataflow information

> [!note]
> This references §3.5 of the textbook.

Now, let's return to our constant propagation problem. We don't want to just keep track of what expressions call what functions; we want to keep track of other information as well, like we might with a dataflow analysis!

Basically, we can just extend the abstract domain $L$ to not just contain the set of functions, but to also contain whatever other extra information we want! For example, in the textbook, §3.5.1 describes an analysis that stores both which functions are called, as well as a set of properties about the expressions: if they are a `true` or `false` bool, or if they are a negative, positive, or 0-valued integer.

So, let's do constant propagation analysis! Remember that in constant propagation analysis, each value is either $\top = UNDEF$, $\bot = NAC$, or an integer $z \in \mathbb{Z}$. We can denote this possible set of values as $\mathbb{Z}^\top_{\bot}$—the set of integers with both top and bottom. There are two different ways of treating extra dataflow information: keeping it separate from, or combining it with, control flow analysis.

In the textbook, we keep these things separate. The textbook defines a *monotone structure* to consist of a lattice $L$ and a set $\mathcal{F}$ of monotone functions $L \times L \to L$. Additionally, we need to be able to lift constants and binary operations on those constants into lattice values. Formally, this structure must consist of a mapping $\iota_{c}$ from constant $c$ in the language to a lattice value in $L$, and a mapping $f_{o}$ from binary operation $o$ to a function in $\mathcal{F}$. A monotone structure for constant propagation analysis would set $L = \mathbb{Z}_{\bot}^\top$. In an instance of this structure, we map $\iota_{x} = x$, and define a function $f_+$ that performs addition in the presence of $\top$ and $\bot$.

Because of this, we also introduce abstract data values $\hat{d} \in L$, abstract data environments $\hat{\delta} \in Var \to L$, and abstract data caches $\hat{D} \in Lab \to L$.

Now, statements are in the form:
$$
(\hat{C}, \hat{D}, \hat{\rho}, \hat{\delta}) \models_{D} e
$$
where the $D$ in $\models_{D}$ just means "this has dataflow stuff involved" I guess. We update our rules accordingly:

![[Screenshot 2024-07-26 at 10.50.16 PM.png]]
![[Screenshot 2024-07-26 at 10.50.26 PM.png]]
![[Screenshot 2024-07-26 at 10.51.09 PM.png]]

Explanations:

- For constants, the constant should be in our analysis.
- For application, we propagate following our rule-of-thumb as before: *argument to parameter, lambda body to application.*
- For binary operations, calling the appropriate lifted operation on the arguments should be less than the analysis for the whole expression

Alternatively, in the lecture notes, we define $L$ as the union between control flow analysis and our constant propagation analysis. This simplifies the rules somewhat:

![[Screenshot 2024-07-26 at 10.46.58 PM.png]]
![[Screenshot 2024-07-26 at 10.47.04 PM.png]]
![[Screenshot 2024-07-26 at 10.47.21 PM.png]]

where $+_{\top}$ is analogous to $f_{+}$ in the textbook's treatment.

# Context sensitivity: k-CFAs and m-CFAs

> [!note]
> This references §3.6 of the textbook.

So what do we mean by *context sensitivity* of analyses? Let's look at the following expression:

![[Screenshot 2024-07-26 at 10.53.18 PM.png]]

In our current analysis, we note the following:

- `x` in `fn x => x` can take on one of two values: `fn x => x` from (4) and `fn y => y` from (5).
- We return `x` in (5) and (8); since `x` can be either value, (5) and (8) must also be either value.

However, the expression ultimately evaluates to `fn y => y`, meaning our analysis is imprecise! It thinks the expression could have two possible values, but that's wrong. The key error here is *lack of context*—the analysis can't distinguish between `f f` and `(f f) (fn y => y)`, i.e., `f (fn y => y)`. Only the second call is actually responsible for dictating the possible function values (9) can take on!

if we explicitly divide `f` into two different functions, called in different places, our analysis then works:

![[Screenshot 2024-07-26 at 10.55.19 PM.png]]

Here, the analysis proceeds as follows:

- `x1` only takes on `f2`, and `f2` only takes on `fn y => y`.
- By application, `(f1 f2)` includes the fns in the body of `f1`—i.e., `f2`.
- By application again, `f2` includes only the fns in the body of `f2`—i.e., `fn y => y`

The analysis can now realize that `x1` can only be bound to `fn x2 => x2`, and `x2` can only be bound to `fn y => y`. Thus, when calling the overall expression, only `fn y => y` is a possible value.

The difference here is **context**. The variable `f` occurs in different places, but in each place, its argument `x` can take on different values, as was made clear when we split its uses out into two different functions `f1` and `f2`. The difference is in the expressions that were evaluated before each call of `f`—basically, the *call stack* that led to this application of `f`! This is what we mean by the **context** and by "occurring in different places."

In the literature, context-sensitivity is also referred to as **polyvariance**, with context-insensitivity referred to as **monovariance**.

## k-CFAs

In a **$k$-CFA analysis**, whenever we come across a function application, we record it in a context $\delta$, which contains the last $k$ function calls. Thus, a context is a sequence of labels of length at most $k$:
$$
\delta \in \Delta = Lab^{\leq k}
$$
Our abstract environment $\hat{\rho}$ now requires us to provide both a variable *and the context* in order to get the analysis value:
$$
\hat{\rho} \in (Var \times \Delta) \to L
$$
Of course, we need to now store contexts in our analysis too. Indeed, at each subexpression point, we want to store the mapping from all free variables in a term to the (up to) $k$ most recent applications before that variable was bound. Why only free variables, you might ask? We'll get to that soon :)

We call this mapping a **context environment**. The *context environment* $ce \in \mathrm{CEnv}$ will determine the context associated with the current instance of a variable in a subexpression.
$$
ce \in Var \to \Delta
$$
Our abstract value domain $L$ is now a set of tuples: the abstraction that subexpression could take on, and the local context environment at that subexpression:
$$
L = \mathcal{P}(Term \times CEnv)
$$
> [!note] Uniform $k$-CFA analysis vs. $k$-CFA analysis
> Confusingly, a ==uniform== $k$-CFA analysis differs from a $k$-CFA analysis. In the uniform $k$-CFA analysis, our treatment of the abstract cache mirrors the abstract environment, taking a product of labels and contexts:
$$
\hat{C} = (Lab \times \Delta) \to L
$$
>
> However, in a regular $k$-CFA, we have $\hat{C} = (Lab \times CEnv) \to L$. I believe these are functionally equivalent, and just differ in terms of framing? We call the former "uniform" since both the abstract environment and abstract cache use the same precision.

So how do we go about performing this analysis? First, let's look at the notation for our acceptability judgment now:
$$
(\hat{C}, \hat{\rho}) \models_{\delta}^{ce} e
$$
Our judgment is now with respect to a context environment $ce$ and a context $\delta$. It's helping to think of these as a sort of "global state" of the algorithm building up constraints; when analyzing subterms of $e$, we will require that judgments with modified $ce$ and $\delta$—based on our current values—of the subterms hold.

Now, let's look at function introduction:

![[Screenshot 2024-07-27 at 6.54.06 PM.png]]

The analysis information we store at $l$ must contain the lambda itself, as before, along with this current context environment: the global context environment $ce$ restricted to only map from free variables within the function. We do this because we introduce information about $x$ into $ce$ at function application time! Speaking of:

![[Screenshot 2024-07-27 at 6.39.38 PM.png]]

Let's unpack this rule:

- Let's say $ce$ and $\delta$ are the current environment and context as we're performing this analysis.
- Checking the body $t_{0}^{l_{0}}$ involves a new context environment $ce_{0}'$ and a new context $\delta_{0}$.
 	- $\delta_{0}$ now contains $l$, the most recent application.
  		- $\lceil \delta, l \rceil_{k}$ is their notation for "$\delta$ with $l$ appended, then truncated to the most recent $k$."
 	- $ce_{0}'$ now maps from $x$, the newly bound variable, to the context at this point.
  		- Remember that $ce_{0}$ is the mapping for all free variables in the lambda.
  		- $x$ isn't free in the lambda term; $ce_{0}'$ thus provides a mapping for $x$.
  		- Remember that the meaning of a variable being in an environment is "whatever the call stack was up to when this variable was bound"
  		- We preserve free variables because inside $t_{0}^{l_{0}}$, $x$ is now free, and we want to retain that information as-is for $x$.
- Remember the rule-of-thumb for how constraints propagate: **argument flows to parameter**, **value of body flows to application**:
 	- Argument flows to parameter: $\hat{C}(l_{2}, \rho) \subseteq \hat{\rho}(x, \delta_{0})$
 	- Body flows to application: $\hat{C}(l_{0}, \delta_{0}) \subseteq \hat{C}(l, \delta)$
 	- Be careful about threading the right arguments in the right places!

And for completeness, here are the other two rules:

![[Screenshot 2024-07-28 at 8.59.37 PM.png]]

## A worked example

> [!danger] TODO
> Haven't done this yet.

## Tradeoffs & space complexity

> [!note]
> Also taken from the [Harvard lecture slides](https://groups.seas.harvard.edu/courses/cs252/2011sp/slides/Lec10-CFA.pdf).

So if adding context makes our analysis better, why not do it all the time?

The summary is that $k$-CFA has **exponential space complexity**, even if $k = 1$! In the $k = 1$ case, if you have a size $n$ expression with $p$ different variables, $\Delta$ will have $O(n)$ different elements—as expression size grows linearly, the number of labels grows linearly, and a context must be a single label, since $k = 1$. Thus, $CEnv$, a mapping from $Var \to \Delta$, has $O(n^p)$ possible values.

> Since $Val$ is a powerset of pairs $(t \in Term, ce)$, and there are $O(n \times n^p)$ pairs it follows that $Val$ has height $O(n \times n^p)$. Since $p = O(n)$ we have the exponential worst case complexity claimed above.

By contrast, 0-CFA analysis corresponds to letting $\Delta$ be a singleton; there's only one possible $\delta = \varnothing$. $Val$ is a lattice of height $O(n)$ with respect to program size, which has polynomial complexity (as we'll see in [[#Practical implementation]]).

## From k-CFA to m-CFA

> [!note]
> Now we reference the above slides and [this paper](https://yanniss.github.io/kcfa-pldi10.pdf).

From above, it turns out $k$-CFA is exponential time. However, other folks have found that performing $k$-CFA in object oriented settings is polynomial time!

The reason this is is because objects are subtly different than closures. Within a closure, each variable could be bound in a different context. This is why our $CEnv$ has to map from $Var \to \Delta$; each variable could have a different context, because closures can *capture* outside variables!

By contrast, in OO languages, objects can't capture outside variables. Instead, whenever they create a "closure," they have to call a constructor that *explicitly copies the variables* into the object, so they can be referenced at that point. Think of how Rust handles closures internally: it explicitly creates a struct that *copies* all of the variables at that point into its own state:

```rust
let x = 4;
let f = || {
  x + 1
}();
```

is equivalent to

```rust
struct F {
  x: u32,
}

impl F {
 fn call(&self) -> u32 {
  self.x + 1
 }
}

let x = 4;
let f = (F { x }).call();
```

Because of this, **all variables are bound in the same context**. $CEnv$ doesn't need to map from $Var \to \Delta$, since it'll be the same $\Delta$ regardless of what $Var$. Thus, $CEnv = \Delta$, restoring polynomial time, since $Val = Term \times CEnv$ will have $O(n \times n) = O(n^2)$ possible values.

This is the core idea of **$m$-CFA**: instead of recording the last $k$ call sites, we record the last $m$ **stack frames**. Instead of keeping track of one context per variable, we record one context only: the scope in which a closure was *captured* (i.e., where a lambda happens I guess).

## Cartesian Product Algorithm

> [!note] See also
> Read [[sridharanAliasAnalysisObjectOriented2013#Cartesian Product Algorithm]] first!

For a language with multi-argument function calls, we can rephrase 0-CFA analysis to act on cartesian products of the arguments.

![[Screenshot 2024-07-28 at 9.49.58 PM.png]]

With the **Cartesian Product Algorithm**, we see a way of implementing context sensitivity in the presence of multi-variable functions. This is kind of implementing $m$-CFAs, since we capture all variables at once. A context $\delta$ now is a product of terms. We construct a context in function application by performing a cartesian product on the sets of all possible analysis values for each argument. This product must be in the product of all possible analysis values for the output variables.

In essence, following our [[#Constraint flow rule-of-thumb|rule of thumb]], analysis flows from products of analyses on concrete values to products of analyses on abstract variables.

# Practical implementation

> [!note]
> This references §3.3-3.4 of the textbook.

Okay. That was a lot of theory. In this section, we're gonna cover how might we implement CFA constraint generation and solving in practice.

The goal is to find the smallest solution $(\hat{C}, \hat{\rho})$, where "small" is given by the partial order on the product lattice of $\widehat{\mathrm{Cache}} \times \widehat{\mathrm{Env}}$:

![[Screenshot 2024-07-27 at 8.33.20 PM.png]]

Our approach will be to reformulate the specification of $\models e$ into one that's more suited for computation:

1. We'll change the spec in a [[ahoDragonBookGrammars2007|syntax-directed manner]]
2. We use this new spec to define an algorithm for generating constraints
3. We'll compute the least solution of this set of constraints.

## Syntax-directed specification

Our syntax-directed reformulation ensures that every function body is analyzed at most once. We do this by moving body analysis into lambda introduction—instead of where it was in application, i.e., lambda elimination. This has the cost of analyzing potentially unreachable program fragments (e.g., analyzing the body of a function that's never called).

## Syntax-directed constraint generation

With this new spec, we can define a syntax-directed constraint generation algorithm!

![[Screenshot 2024-07-27 at 8.46.52 PM.png]]
![[Screenshot 2024-07-27 at 8.47.04 PM.png]]

> [!note] Notation notes
>
> - We read $\{ t \} \subseteq a \implies b \subseteq c$ as $(\{ t \} \subseteq a \implies b) \subseteq c$.
> - What does it mean to have an implication be a subset of another set? The next section will clarify this!

## Solving these constraints

How do we solve these constraints? There are two broad solutions:

- **Fixed-point**, complexity $O(n^5)$ over size of the expression $n$.
 	- On each iteration, we update the abstract cache as follows:
  		- For every label $l$ in the environment
  		- Get every constraint of the form $ls \subseteq C(l)$.
  		- $ls$ will have one of two forms. We must transform $ls$ into a set of terms:
   			- If $ls$ is a set $\{ t \}$, return $\{ t \}$.
   			- If $ls$ is $C(l)$, this means $\hat{C}(l)$.
   			- If $ls$ is of the form $\{ t \} \subseteq lhs \implies rhs$:
    				- If $\{ t \} \subseteq lhs$, transform $rhs$.
    				- Otherwise, return $\varnothing$.
    				- When we say "transform," we mean "do the same pattern matching we just did on $ls$."
   			- Remember that we have to do this because we have that "implication subset" notation going on above.
  		- Combine all transformed $ls$ items to yield $C(l)$.
 	- Do the same with the abstract environment.
- [[repsProgramAnalysisGraph1998|Graph reachability]]****, complexity $O(n^3)$. ^203nd2
 	- The nodes are all the variables and labels. Each node $n$ contains the analysis, initially initialized to every term mentioned in a $\{ t \} \subseteq n$ constraint.
 	- A constraint $p_{1} \subseteq p_{2}$ creates an edge $p_{1} \to p_{2}$
  		- This edge is traversed only whenever $p_{1}$ has a new term.
 	- A constraint $\{ t \} \subseteq p \implies p_{1} \subseteq p_{2}$ creates edges $p_{1} \to p_{2}$, $p \to p_{2}$.
  		- These edges are only traversed if $\{ t \}$ is in the analysis for $p$.

Either of these algorithms produce the **least** solution to $\mathcal{C}_{*}[\![e_{*}]\!]$, and thus the **least** $(\hat{C}, \hat{\rho})$ that satisfies $(\hat{C}, \hat{\rho}) \models e_{*}$.

We can't really *check* if an abstract environment and cache are acceptable for an expression though. This is important when we're trying to optimize $e$ and not $(\hat{C}, \hat{\rho})$; maybe the latter represents assumptions about our environment, meaning we can swap out $e$ and any optimizations based on a choice of $(\hat{C}, \hat{\rho})$ will continue to hold so long as $(\hat{C}, \hat{\rho}) \models e'$.
