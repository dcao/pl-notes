---
aliases:
  - "Principles of Program Analysis 4: Abstract interpretation"
  - abstract interpretation
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
> [!note] See also
> These notes incorporate several other resources, in order of used-ness:
> 
> - [Abstract Interpretation in a Nutshell](https://www.di.ens.fr/~cousot/AI/IntroAbsInt.html)
> - [Isil Dillig's lecture notes on Abstract Interpretation](https://www.cs.utexas.edu/~isil/cs389L/AI-6up.pdf)
> - [Patrick Cousot's paper on abstract interpretation](https://www.di.ens.fr/~cousot/COUSOTpapers/publications.www/Cousot-LNCS2000-sv-sb.pdf)
> - The [Wikipedia page for abstract interpretation](https://en.wikipedia.org/wiki/Abstract_interpretation), specifically beginning with the § on formalization
> - [This page on abstract interpretation](https://www.di.ens.fr/~cousot/AI/#tth_sEc2)
> - [These notes](https://web.eecs.umich.edu/~bchandra/courses/papers/Salcianu_AbstractInterpretation.pdf)
>   
> Additionally, for practice talking about abstract interpretation, see [[2024-07-31 • Justin, prelim targeted - abstract interpretation]]

Abstract interpretation is a **general framework**

# A high-level overview

Before we dive into the textbook, let's provide a very high-level overview of what abstract interpretation is.

Often times, we have some correctness property we want to prove about our program—for instance, "program $p$ never reaches state $s$." However, using the *concrete semantics* of our language—the possible executions of our program—and checking that the property actually holds for our exact program behavior is undecidable.

However, when proving properties about our programs, often times we don't need to know the exact execution traces of our programs; instead, we can just approximate the behavior of our program by recording more general properties about our programs, and then having our semantics act on those general properties. For instance, if we want to weed out "divides by 0" bugs, we could the record the sign or zero-ness of every variable, and propagate this analysis by defining what analysis values should be returned from function calls. Or, if you want to do interval analysis generally, you could have that be your analysis.

In other words, we can use an **abstract semantics**—a conservative over-approximation of our program's possible execution behavior. If we can prove program correctness holds for this over-approximation, then it must hold for the actual programs!

This is **abstract interpretation**, and it provides a general framework around program analyses, just as [[ahoDragonBookMachineindependent2007|dataflow analysis]] provides a framework for program analyses. As we've alluded to in the example above, an abstract interpretation consists of two pieces:

- the **abstract domain**; the general property that we record in place of the programs themselves.
- the **abstract semantics**, which defines how programs transform these properties.

## The upshot

We have two questions: **why does this matter**, and **how is this related to other static analysis approaches: dataflow analysis and control-flow analysis**?

> [!note] See also
> Taken from https://pages.cs.wisc.edu/~horwitz/CS704-NOTES/10.ABSTRACT-INTERPRETATION.html

As alluded to in the above section, abstract interpretation is another framework for static analysis, similar to dataflow analysis. In particular, they both use lattices, though in *different* ways, as you'll see below!

However, unlike dataflow analysis, abstract interpretation guarantees that our program analysis results are consistent with a program's semantics! In abstract interpretation, we establish key relationships between the static analysis and the formal semantics. Additionally, we can iteratively build up more complex or more approximate analyses using simpler or more precise analyses, and still maintain guarantees that the analysis agrees with the semantics.

In dataflow analysis, we never establish this, and so we don't have this guarantee.

A [[nielsonPrinciplesProgramAnalysis1999a|control flow analysis]] is a *form* of abstract interpretation!

> [!danger]
> Note that [[denotational semantics and domain theory]] also uses partial ordering, but in a completely different way than we're using. Both use partial orders/posets to help with their formalizations, but completely differently. **Don't mix them up!**

# Abstract interpretations in depth

In the concrete world, a program $p$ might transform a concrete value from $v_{1}$ to $v_{2}$. If the concrete semantics of language dictates that $p$ evaluates $v_{1} \in V_{1}$ into $v_{2} \in V_{2}$, we denote that as: $$ p \vdash v_{1} \rightsquigarrow v_{2} $$
> [!example] Example: imperative statements
> For example, in [[winskelWinskelDenotationalSemantics1993#IMP a simple imperative language|IMP]], a statement $c$ transforms from state to state. In operational semantics land, we might say that a statement and a state eventually evaluates to a new state: $\langle c, \sigma \rangle \Downarrow \sigma'$. Similarly, for a single statement $c$, we can state the following relation: $$ c \vdash \sigma \rightsquigarrow \sigma' $$
> Additionally, for a bunch of $c$ statements $c_{*}$, we could say: $$ c_{*} \vdash \sigma_{1} \rightsquigarrow \sigma_{2} \iff \langle c_{*}, \sigma_{1} \rangle \Downarrow \sigma_{2} $$
> We'll say that these concrete values in our language are part of the set $V = V_{1} = V_{2}$. Since evaluation may be non-deterministic (this is the whole point—it's undecidable!), there's no function to denote this. Our *concrete semantics* defines what programs and states are in this relation.

Note that we never enforce $V_{1} = V_{2}$. In functional programs, for instance, this isn't necessarily the case!

Additionally, we'll have a **program analysis** on expressions in our program. For instance, this might be an interval analysis that says "this expression must be within these two ints." Maybe it's a [[ahoDragonBookMachineindependent2007#Constant propagation|constant]] [[nielsonPrinciplesProgramAnalysis1999a#Adding dataflow information|propagation]] analysis that says "this expression must have constant value $x$." Either way, elements in $L$ are an *abstraction* of expression behavior—they record some property about our expression.

In our **abstract semantics**, programs act on a property $l_{1} \in L_{1}$ and return another property $l_{2} \in L_{2}$. To denote this, we write: $$ p \vdash l_{1} \rhd l_{2} $$
We can define a deterministic function $f_{P}(p_{1}) = p_{2} \iff p \vdash p_{1} \rhd p_{2}$. This family of functions $f_{*} : L_{1} \to L_{2}$ is our abstract semantics: how do we symbolically execute statements/expressions in the abstract domain? In some literature, $f_{P}$ is called the **abstract transformer**.

In the context of abstract interpretation, we insist that $L_{1}$ and $L_{2}$ are [[lattice|lattices]]—having both a meet ($m = a \land b \iff m \sqsubseteq a \land m \sqsubseteq b$) and a join ($j = a \lor b \iff a \sqsubseteq j \land b \sqsubseteq j$) that agree on a definition of partial ordering (the absorption laws: $a \land (a \lor b) = a$, $a \lor (a \land b) = a$).

In short, this means that we're creating an **abstract interpreter** for our language. Instead of defining semantics for how values get transformed to values, we define semantics on how abstract values get transformed into other abstract values. This could be a range if we're doing interval analysis, or information about the sign of different expression, or things like that.

To be honest, that's all you really need to understand the technique. The next sections go through a *ton* of math, but most of this is used to formalize what we mean by "abstract interpreter," and thus establish the important correctness properties of abstract interpretation:

- If we can define a *representation function* that represents concrete values in terms of analysis values, and this function fulfills a certain quality, we know that our analysis will preserve the semantics of our programs!
- If we have a precise analysis $L$ and a more coarse analysis $M$, and they fulfill certain properties with respect to each other, we can establish an equivalence between them, which gives us the ability to move between them and combine analyses with respect to this equivalence.
- For sound analyses that need to run iteratively to fixpoint, we can use *weakening* and *narrowing* to ensure that we get relatively good results in a reasonable amount of time.

> [!note]- More info on the intuition between dataflow analysis and abstract interpretation
>
> I'm not sure any of the answers here really address the intent of the original question, which seems to be asking for an intuitive, not technical, explanation. Dataflow analysis is concerned with getting the value of some piece of information at a given location. Examples of "information" are which definitions reach a given location, which variables are live at a given location, which expressions are constant at at a given location etc. Dataflow frameworks will typically require that the domain of values forms a finite lattice, that the transfer functions be monotone (the transfer function determines how that information is propagated from entry to the exit of the block), all this with the aim of being able to compute a fixed-point of dataflow values. It is used in compilers.
>
> Abstract Interpretation (AI) OTOH aims to construct an abstract interpreter of the language. The goal is to determine "What does this piece of code compute? Lets try and answer that question in an abstract sense". For example, if the computation returns the value of some index variable i, AI might compute a range for i so you can answer if there will be a bounds violation or something. So the domain of abstract values is slightly different, it might be a range domain, a polyhedral domain, etc. For this reason AI places different constraints from dataflow: the concrete and abstract domains are typically required to be related by something called a galois connection, which relates sets of concrete values to abstract ones. Because the domains used aren't required to be finite, AI won't always converge without intervention, in the form of widening/narrowing operations. AI is used in formal verification tools. They both share in common a desire to have the function iteration converge but that's about it. So use dataflow analysis if you want to know the value of something at a location, use AI if you want to know what a program abstractly computes.
>
> Both dataflow and AI can be used together. For example the disassembler tool Jakstab combines both - the dataflow is used to determine values for indirect jump targets (ie. what is new computed the value of the PC that will be loaded) and the AI is used to abstractly evaluate the piece of binary code.
> 
> *This was copied from [this StackOverflow answer](https://stackoverflow.com/questions/17371169/what-is-the-difference-between-data-flow-analysis-and-abstract-interpretation)*

## Soundness and correctness

> [!note]
> For the next few sections, we're gonna get pretty abstract. Hold on! We'll bring back concrete examples very soon.

So how do we know that an abstract semantics "corresponds" to a concrete semantics? That is to say, how do we know that if a property holds for the abstract semantics, it also holds for the concrete semantics? This is formalized as **soundness** (also called **correctness** in the textbook).

To formalize this, we first define **representation functions** $\beta_{1}$ and $\beta_{2}$, which maps from the concrete domains $V_{1}$ and $V_{2}$ to the *best* values describing them in abstract domains $L_{1}$ and $L_{2}$, respectively.

We can formulate "correctness" or "soundness" of an analysis like so: $$ p \vdash v_{1} \rightsquigarrow v_{2} \land p \vdash l_{1} \rhd l_{2} \land \fbox{$\beta_{1}(v_{1}) \sqsubseteq l_{1} \implies \beta_{2}(v_{2}) \sqsubseteq l_{2}$} $$
The most important part of this equation is boxed: if $v_{1}$ is safely described by $l_{1}$, then the final value $v_{2}$ is safely described by $l_{2}$.

> [!note] Alternative framing around relations
> Alternatively, we can frame correctness in terms of a *correctness relation* $R : V \times L \to Bool$, which returns whether a value $v$ is described by the property $l$. This relation must have the following properties:
> 
> 1. $v\ \mathcal{R}\ l_{1} \land l_{1} \sqsubseteq l_{2} \implies v\ \mathcal{R}\ l_{2}$
> 2. $(\forall l \in L' \subseteq L. v\ \mathcal{R}\ l) \implies v\ \mathcal{R}\ (\sqcap L')$
>    
>  > Due to the first condition, if $l_{1}$ approximates $v$ and the analysis is able to compute an upper approximation $l_{2}$ of $l_{1}$, $l_{1} \sqsubseteq l_{2}$, $l_{2}$ is also an approximation of $v$. Therefore, in the property lattice $L$ if $l_{1} \sqsubseteq l_{2}$, then $l_{1}$ is more precise than $l_{2}$ ($l_{2}$ approximates all the values approximated by $l_{1}$ and possibly some other ones).
>  > 
>  > If a value is approximated by more than one abstract value, the second condition allows us to deterministically select a single abstract value to use in our analysis: we take the smallest (i.e., most precise) of them all, $l_{p} = \sqcap \{ l \mid v\ \mathcal{R}\ l \}$. $l_{p}$ is a valid approximation of $v$. This condition excludes correctness relations where a value $v$ is approximated by two incomparable abstract values, and allows us to work with a single analysis instead of considering one analysis for each candidate abstract value.

## On precision and the meaning of partial orderings

Notice that when discussing lattices here, we say $l_{1} \sqsubseteq l_{2}$ to mean that $l_{1}$ is **more precise** than $l_{2}$. However, some literature in data flow has this flipped—$l_{2}$ would be the better, more precise analysis. For instance, this is the case in the Dragon book: ^ceopk4

![[ahoDragonBookMachineindependent2007#^0f06bd]]

For more information, see the note on [[lattice|lattices]], which covers some of these differences and links to different references of lattices.

## Galois connections

Sometimes, if we have a complex analysis $L$, we want to replace $L$ with a simpler lattice $M$. Instead of performing the analysis in $L$, we find a description of the elements of $L$ in $M$, then perform the analysis in $M$. We can define their relationship in terms of two functions:

- An **abstraction function** $\alpha : L \to M$ provides a representation of $L$ elements as $M$ elements
- A **concretization function** $\gamma : M \to L$ expresses the meaning of elements of $M$ as elements of $L$.

There are two isomorphic ways of concretizing the notion that these are comparable analyses.

- In the first approach, we say $(L, \alpha, \gamma, M)$ is a **Galois connection** iff $\alpha$ and $\gamma$ are monotone and the following holds:
	- $\gamma \circ \alpha \sqsupseteq id_{L}$
		- Applying and undoing abstraction will yield something at most as strong as the original. It might be weaker (which is okay, since we don't want abstraction to introduce spurious strength)
	- $\alpha \circ \gamma \sqsubseteq id_{M}$
		- Applying and undoing concretization will yield something at least as strong as the original.
	- In both cases, the operations may lose precision—we might not get back what we started with, but we can get back a safe *approximation*
- Alternatively, we say $(L, \alpha, \gamma, M)$ is an **adjunction** iff $\alpha(l) \sqsubseteq m \iff l \sqsubseteq \gamma(m)$.
	- $\alpha$ and $\gamma$ should respect the ordering between $l$ and $m$.
	- If $m$ safely describes $l$, the concrete version of $m$ should over-approximate $l$.

> [!example]
> We can describe the power set of integers $L = \mathcal{P}(\mathbb{Z})$ as an interval $M = \mathbf{Interval}$. The abstraction function returns the smallest interval that contains all the integers in the set, and the concretization function gets the set of all integers within the interval.
> 
> Note that this relies on a partial ordering of intervals $i_{1} \sqsubseteq i_{2}$, defined as if $i_{1}$ is entirely inside $i_{2}$. Remember that in abstract interpretation, lesser analyses are more precise!

To relate it back to our discussion of program analyses above, we can **define Galois connections using extraction functions**! Given an extraction function $\beta : V \to L$, a program analysis can be seen as a more coarse description of sets of possible values, thus giving rise to the Galois connection: $$ (\mathcal{P}(V), \alpha, \gamma, L) $$
...where abstraction identifies the least upper bound of all the representations of the values in a set: $$ \alpha(V') = \sqcup \{ \beta(v) \mid v \in V' \} $$
...and concretization correspondingly finds all the concrete values such that their representation is less than the abstraction value: $$ \gamma(l) = \{ v \in V \mid \beta(v) \sqsubseteq l \} $$

> [!note] Soundness in Galois connections
> From prelim prep:
> 
> ![[2024-07-31 • Justin, prelim targeted - abstract interpretation#^ccq950]]

## A worked example: sign analysis

As an example, for integer expressions, we might want to figure out if an integer expression could be positive, negative, or zero. For instance, if we see `x = y + z`, and we know `y` is positive and `z` is non-negative, what can we say about the sign of `x`? This is the analysis discussed in the Isil slides (though with less precision than we're doing here)!

In this case, let's say we have two analyses. The first analysis $L = \mathcal{P}(V)$ (where $\sqsubseteq = \subseteq$) yields the set of possible integers that every expression could evaluate to. The second analysis $M = \mathcal{P}(\mathbf{Sign})$ (also where $\sqsubseteq = \subseteq$) gives a *set* of the possible signs that expression could have. We record a set of signs so that we can say things like "`x` is non-negative"—$x = \{ +, 0 \}$. Thus, our Galois connection is: $$ (\mathcal{P}(V), \alpha, \gamma, \mathcal{P}(D)) $$

So how might we define $\alpha$, $\beta$, and $\gamma$? Well to start, it's pretty easy to define a function $\eta : V \to D$ that gets the sign of a number. In general, it's pretty common to have a Galois correspondence between two powersets $\mathcal{P}(V)$ and $\mathcal{P}(D)$ and an *extraction function* $\eta$ that gets us from $V \to D$. In this case, we can define our functions as follows: $$ \begin{aligned}
\beta_{n}(v) &= \{ \eta(v) \} \\
\alpha_{\eta}(V') &= \bigcup \{ \beta_{n}(v) \mid v \in V' \} &= \{ \eta(v) \mid v \in V' \} \\
\gamma_{\eta}(D') &= \{ v \in V' \mid \beta_{\eta}(v) \subseteq D' \} &= \{ v \mid \eta(v) \in D' \} \\
\end{aligned} $$
What this means is that the abstraction function just gets the set of all $D$ values for each of its $V$ values, and the concretization function gets every value where its extraction is in the input extraction set.

In the sign example, we'd read this as: abstraction gets the signs of all of the values in the input set, and concretization gets every integer with a sign contained in our sign set.

## Extra properties of Galois connections

There are some properties we can establish about Galois connections:

- $\alpha$ is purely additive, $\gamma$ is purely multiplicative
	- $\alpha(\bot) = \bot$, $\alpha(\sqcup L') = \sqcup \{ \alpha(l) \mid l \in L' \}$. $\alpha$ has least upper bound, lots of joins—gets *less* precise (remember that we're backwards vs dataflow here)
	- $\gamma(\top) = \top$, $\gamma(\sqcap M') = \sqcap \{ \gamma(m) \mid m \in M' \}$. $\gamma$ has greatest lower bound, lots of meets—gets more precise
- We can define $\alpha$ and $\gamma$ in terms of each other!
	- Let's say we've already defined $\gamma(m)$ somewhere.
	- $\gamma(m) = \sqcup \{ l \mid l \sqsubseteq \gamma(m) \}$
	- Substitute by adjunction: $\gamma(m) = \sqcup \{ l \mid \alpha(l) \sqsubseteq m \}$. Defining $\gamma$ using $\alpha$.
		- If we had originally written $\gamma(m) = \sqcap \{  l \mid \gamma(m) \sqsubseteq l \}$, we wouldn't have been able to use adjunction!
	- Same in other direction: $\alpha(l) = \sqcap \{ m \mid l \sqsubseteq \gamma(m) \}$

## Strengthening Galois connections with Galois insertions

In a Galois connection, $\gamma$ doesn't have to be [injective](https://en.wikipedia.org/wiki/Injective_function) or one-to-one: multiple elements of $M$, when concretized, might map to the same element of $L$. This is because in the definition of a Galois connection, we only guaranteed that $\alpha \circ \gamma \sqsubseteq id_{M}$. Since multiple inputs to $\gamma$, can map to the same output $x$, $\alpha(x)$ may or may not result in the same value as the original!

In a **Galois insertion**, we now require: $$ \alpha \circ \gamma = id_{M} $$
thus guaranteeing that $\gamma$ is injective. Thus, $M$ doesn't contain superfluous elements that describe $L$. This also means that $\alpha$ is *surjective*—for every possible value $m \in M$, there exists some value $l \in L$ where $\alpha(l) = m$. Finally, from this, we know that $\gamma(m_{1}) \sqsubseteq \gamma(m_{2}) \iff m_{1} \sqsubseteq m_{2}$.

Note that if we're using an extraction function $\eta$, since $\alpha$ just calls $\eta$ on all the values in the set, $\alpha$ is surjective if and only if $\eta$ is!

Alternatively, if we have a *reduction operator* $\varsigma : M \to M$ that picks the representative $M$ for each $L$, we can use that. This reduction operator just gets the smallest/most precise value among equivalent $M$ values. This operation is defined as: $$ \varsigma(m) = \sqcap \{ m' \mid \gamma(m) = \gamma(m') \} $$
If we have an extraction function, we can get the reduction operator $\varsigma_{\eta}$ by: $$ \varsigma_{\eta}(D') = D' \cap \{ \eta(v) \mid v \in V \} $$

## Composing Galois connections

The power of defining all this structure is that we can define simpler analyses, prove the core properties of [[#Soundness and correctness]] on those analyses, then compose them together to get more complex analyses. Additionally, if can show equivalences between more precise and more approximate analyses, we can move between precise and approximate analyses too, all while maintaining our guarantees about soundness and correctness!

### Functionally (i.e., sequentially)

If $(L_{0}, \alpha_{1}, \gamma_{1}, L_{1})$ and $(L_{1}, \alpha_{2}, \gamma_{2}, L_{2})$ are Galois connections, we can compose them together sequentially! $(L_{0}, \alpha_{2} \circ \alpha_{1}, \gamma_{1} \circ \gamma_{2}, L_{2})$ is also a Galois connection. This is useful for moving to a more coarse analysis.

### Independent attributes

A product! We have a Galois connection $(L_{1} \times L_{2}, \alpha, \gamma, M_{1} \times M_{2})$ where we apply $\alpha_{i}$ and $\gamma_{i}$ element-wise: $$ \begin{aligned}
\alpha(l_{1}, l_{2}) &= (\alpha_{1}(l_{1}), \alpha_{2}(l_{2})) \\
\gamma(m_{1}, m_{2}) &= (\gamma_{1}(m_{1}), \gamma_{2}(m_{2})) \\
\end{aligned} $$
This can lose us precision. For instance, let's say we have an expression `(x, -x)`. This has possible values $\{ (z, -z) \mid z \in Z \}$. If we do a product $\mathcal{P}(\mathbb{Z}) \times \mathcal{P}(\mathbb{Z})$ to represent integers, and we have a sign analysis $\mathcal{P}(\mathbf{Sign}) \times \mathcal{P}(\mathbf{Sign})$, our most precise analysis in the original analysis is now $(\mathbb{Z}, \mathbb{Z})$, meaning we lose all information about the *relative* signs of the two components. This is a tuple of sets, not a set of tuples.

### Relational method

If we have $(\mathcal{P}(V_{1}), \alpha_{1}, \gamma_{1}, \mathcal{P}(D_{1}))$ and $(\mathcal{P}(V_{2}), \alpha_{2}, \gamma_{2}, \mathcal{P}(D_{2}))$, the **relational method** lets us do products within the powerset: $(\mathcal{P}(V_{1} \times V_{2}), \alpha, \gamma, \mathcal{P}(D_{1} \times D_{2}))$. If we have an extraction function $\eta_{i} : V_{i} \to D_{i}$, we can define: $$ \begin{aligned}
\alpha(VV) &= \{ \eta_{1}(v_{1}), \eta_{2}(v_{2}) \mid (v_{1}, v_{2}) \in VV \} \\
\gamma(DD) &= \{ (v_{1}, v_{2}) \mid (\eta_{1}(v_{1}), \eta_{2}(v_{2})) \in DD \} \\
\end{aligned} $$
This is precise enough to have a sign analysis of $\{ (-, +), (0, 0), (+, -) \}$!

### Total function space

If $(L, \alpha, \gamma, M)$ is a Galois connection and $S$ is a set. We have $(S \to L, \alpha', \gamma', S \to M)$, where $\alpha'$ and $\gamma'$ apply their inputs, returning an $L$ or $M$, respectively, and then we use $\alpha$ and $\gamma$ from the original definition to get to where we need to go.

### Monotone function space

> [!note]
> Remember when we said we'd deal with different lattice value types? Here we are :)

If we have $(L_{1}, \alpha_{1}, \gamma_{1}, M_{1})$ and $(L_{2}, \alpha_{2}, \gamma_{2}, M_{2})$ as Galois connections, we can get the Galois connection $(L_{1} \to L_{2}, \alpha, \gamma, M_{1} \to M_{2})$: $$ \begin{aligned}
\alpha(f) &= \alpha_{2} \circ f \circ \gamma_{1} \\
\gamma(g) &= \gamma_{2} \circ g \circ \alpha_{1} \\
\end{aligned} $$
Basically, to turn $f : L_{1} \to L_{2}$ into a $M_{1} \to M_{2}$, apply $\gamma_{1}$ to turn new input $M_{1}$ into $L_{1}$, apply $f$, then apply $\alpha_{2}$ to go from $f$'s output $L_{2}$ to $M_{2}$. The same applies in the other direction for $\gamma$.

## Other combinations

- **Direct product**: abstraction is element-wise, concretization is join of items
- **Direct tensor product**: is to direct product what relational is to independent items. Requires two $\eta_{1}, \eta_{2}$, similar construction to relational.
- **Reduced product and tensor product**: define reduction to get a Galois insertion

# Taking a step back

Okay. That was. A **ton** of theory. Let's take a step back and come up for some air. What does all of this theory get us? How can express the *intuition* of abstract interpretation using the precise mathematical tools we have now?

## Squaring with Isil Dillig's lecture slides

As we alluded to at the start of this chapter, in an imperative language like [[winskelWinskelDenotationalSemantics1993|IMP]], we can interpret a statement $c$ as a function from state to state. A state is just a mapping from a variable to a concrete value. This is expressed in the notation of this chapter like so: $$ c \vdash \sigma_{1} \to \sigma_{2} $$
In the Isil Dillig lecture notes, our **abstract semantics** maps abstract states to abstract states, where abstract states map variables to abstract values:

![[Screenshot 2024-07-30 at 3.45.55 PM.png]]

We might express this relationship in our notation as: $$ c \vdash a_{1} \rhd a_{2} $$
where $a_{1}, a_{2} \in Var \to A$ for some abstract analysis value $A$.

Now, let's say we want to do sign analysis, as the lecture slides do. Thus, our analysis value $A = \mathcal{P}(\mathbf{Sign})$. And let's say we want to perform analysis on a statement `x = y + z`. The concrete semantics of that statement are as follows: $$ x = y + z \vdash \sigma \to \sigma[x \mapsto y + z] $$
Now we want to go about defining an analysis such that we can intuit the sign of $x$ based on the signs of $y$ and $z$. In other words, we want to define an interpreter that takes some state $Var \to \mathcal{P}(\mathbf{Sign})$ and returns a new state of that same type.

Let's first start by looking at plus expressions themselves. The semantics of a plus expression is to add together a pair of numbers: $$ y + z \vdash (y, z) \rightsquigarrow y + z $$
So how can we get an analysis of the sign of $y + z$?

Well, we can start by lifting numbers $\mathbb{Z}$ into a very precise analysis that records sets of numbers $\mathcal{P}(\mathbb{Z})$. The lecture slides do this implicitly:

![[Screenshot 2024-07-30 at 4.03.03 PM.png]]

Notice how the lecture slides refers to the concrete meaning of our abstract domain as *sets* of integers, not just integers! We do this lifting with our representation function $\beta : \mathbb{Z} \to \mathcal{P}(\mathbb{Z})$. This function just wraps the number in a set: $\beta(z) = \{ z \}$. Note that this also creates a Galois connection between $\mathbb{Z}$ and $\mathcal{P}(\mathbb{Z})$! Our concrete semantics is also a kind of program analysis: the most concrete, precise possible analysis!

Now, since we're operating on sets of numbers, we can define a precise analysis of $+$ that says: given the possible input values to $+$, what are the possible output values? $$ f_{+}(i) = \{ y + z \mid (y, z) \in i \} $$
Now, the Galois connection in the lecture slides corresponds to what we worked on in [[#A worked example sign analysis]]. We defined a function $\eta : \mathbb{Z} \to \mathbf{Sign}$, returning the sign of an integer. This gives us the Galois connection $(\mathcal{P}(\mathbb{Z}), \alpha_{\eta}, \gamma_{\eta}, \mathcal{P}(\mathbf{Sign}))$, letting us get the set of signs in a set of integers.

Additionally, using the relational method, we can get the Galois connection $(\mathcal{P}(\mathbb{Z} \times \mathbb{Z}), \alpha_{SS'}, \gamma_{SS'}, \mathcal{P}(\mathbf{Sign} \times \mathbf{Sign}))$.

With these different pieces, we can compose together everything we need to get a sign-approximate analysis of $+$. Using the monotone function space, we can compose together our different functions: $$ g_{plus} = \alpha_{sign} \circ f_{plus} \circ \gamma_{SS'} $$

The benefit of abstract interpretation is that at every step of the way, we know that this analysis is valid with respect to our concrete semantics!

Further up, our analysis for the statement can call into $g_{plus}$.

Finally, remember that our actual analysis is a *mapping* $Var \to \mathcal{P}(\mathbf{Sign})$. We can lift the concrete $Var \to \mathbb{Z}$ into our precise analysis $Var \to \mathcal{P}(\mathbb{Z})$ with the Galois connection between total functions. We can do this again to $Var \to \mathcal{P}(\mathbf{Sign})$ to get our full abstract environment.

## Types of analyses

So what can we do with abstract interpretation? A ton.

- Relational domains
	- **Karr's domain**: linear equalities between variables (e.g., $x = 2y + z$)
	- **Octagon domain**: constraints of the form $\pm x \pm y \leq c$
	- **Polyhedra domain**: constraints of the form $c_{1}x_{1} + \cdots + c_{n}x_{n} \leq c$
- Rounding error analysis (egglog, Herbie)
- Interval analysis (also egglog, Herbie)
- Symbolic analysis
- **Strictness analysis**: will a parameter in a function call be evaluated? Does this call terminate?
- [[sridharanAliasAnalysisObjectOriented2013|Aliasing and pointer anlaysis]]
- **[[escape analysis|Escape analysis]]**: does data lifetime exceed scope?
- Heap analysis: memory leak detection, etc.
- [[nielsonPrinciplesProgramAnalysis1999a|Control flow analysis]]

## With respect to MOP in dataflow

The dataflow world has something called a [[ahoDragonBookMachineindependent2007#^6a3dc5|meet-over-paths]] solution, where we get a fixpoint solution via transfer functions. In the abstract interpretation world, we specify static analysis algorithms as approximations of program semantics, and use our soundness/correctness rules to ensure that these are valid approximations.

The abstract interpretation fixpoint solution is the same as the MOP solution for distributive abstract interpretations—when abstract transformers (i.e., abstract interpreters) preserve union.

> [!danger]
> I don't know what means but this is on [this page about abstract interpretation](https://www.di.ens.fr/~cousot/AI/#CousotCousot79-1-POPL):
> 
> > Otherwise, the abstract domain used for the fixpoint solution can be minimally enriched into its _disjunctive completion_ to get exactly the "MOP solution" in fixpoint form (on the completed abstract domain)

# Fixed points

As we've elaborated above before, we express the relation that our abstract interpreter transforms a state $l_{1}$ into a new state $l_{2}$ when executing program $p$ with the notation $p \vdash l_{1} \rhd l_{2}$. Simultaneously, we denote this as $f(l_{1}) = l_{2}$ for a monotone function $f : L \to L$ dependent on the program $p$.

However, for recursive or iterative program constructs, we want to obtain the least fixed point, $lfp(f)$, as the result of a *finite* iterative process. In [[denotational semantics and domain theory]], we do this by calling $f$ over and over again, starting with $\bot$; this denoted $f^n(\bot)$. Because of Tarski's fixed point theorem, we have a guarantee that the fixed point of this value exists, and that the least pre-fixed point is equal to $\bigsqcup_{n \geq 0} f^n(\bot)$.

**However**, this relies on $f$ being continuous, which we didn't guarantee! In general, if our lattice has infinite height, we can't make the same guarantee. And practically, when implementing this in the real world, this might just take too damn long to converge!

Thus, we don't know if this infinite sequence stabilizes, and even if it does, whether that is truly the least fixed point of the function.

## Some notation

Before we move on, let's establish some notation.

Since a function can have many different fixed points—values where applying the function returns the same thing—we denote the set of all these fixed points as $Fix(f)$: $$ Fix(f) = \{ l \mid f(l) = l \} $$
We can also define two others sets $Red(f)$, when a function is *reductive* and results in a value smaller according to the partial order: $$ Red(f) = \{ l \mid f(l) \sqsubseteq l \} $$
...and $Ext$, when the function is *extensive* and results in a value larger according to the partial order: $$ Ext(f) = \{ l \mid l \sqsubseteq f(l) \} $$

The different possible fixed points for $f$, and how they relate to each other, is summarized in this diagram:

![[Screenshot 2024-07-30 at 6.23.02 PM.png]]

Note that the greatest lower bound for $Red(f)$ is equal to that of $Fix(f)$; it's $lfp(f)$.

If we started with $\top$, we would be starting with a hella over-approximation! Not precise enough.

## Widening

Okay. So we can't say that $f^n(\bot)$ eventually stabilizes, and we can't say that if it does, that stabilizing point is $lfp(f)$. And sometimes stabilizing just takes way too long. What do we do?

At a broad level, we first calculate an over-approximation of a fixed point that we know will converge. We will then later iteratively improve this approximation until we reach a true least fixed point. To calculate this over-approximation, we introduce a **widening** operator $\nabla : L \times L \to L$. This operator has two properties that will be helpful for us:

- $a \lor b \sqsubseteq a \nabla b$
	- It must provide an "upper bound" on $a$ and $b$.
	- We don't require $\nabla$ to be monotone, commutative, associative, or absorptive.
	- It literally just has to return something bigger than $a$ and $b$.
	- We don't guarantee that $l \nabla l = l$!
- Given a chain $d_{0} \sqsubseteq d_{1} \sqsubseteq \cdots$, the chain $d_{0}^\nabla \sqsubseteq d_{1}^\nabla \sqsubseteq \cdots$ eventually stabilizes.
	- $d_{0}^\nabla = d_{0}$
	- $d_{i + 1}^\nabla = d_{i}^\nabla \nabla d_{i + 1}$
	- Essentially, build the next item of the chain by $\nabla$-ing with the previous item.
	- Basically, we *widen*! At each point in the chain, the next item has to be at least bigger than that point in the original chain, as well as every other previous item in the new chain.
	- Think: $0 \leq 1 \leq 3 \leq 5$ becomes $0 \leq 2 \leq 4 \leq 7$.
	- Forcing items to become bigger!

Normally to show that $\nabla$ eventually stabilizes for some definition of $\nabla$, you assume it doesn't and do a proof by contradiction.

> [!example]
> We can define a simple widening operator for intervals. $$ [a, b] \nabla [c, d] = [\operatorname{if}(a > c, -\infty, a), \operatorname{if}(b < d, +\infty, b)] $$
> Wherever the first interval is inside the second, extend to infinity. Otherwise, use the first interval.

With this operator, we can define $f_{\nabla}^n$, the version of $f^n$ that uses our widening operation: $$ \begin{aligned}
f_{\nabla}^n &= \bot &&\text{if } n = 0 \\
&= f_{\nabla}^{n - 1} &&\text{if } n > 0 \land f(f_{\nabla}^{n - 1}) \sqsubseteq f_{\nabla}^{n - 1} \\
&= f_{\nabla}^{n - 1} \nabla f(f_{\nabla}^{n - 1}) &&\text{otherwise} \\
\end{aligned} $$
Essentially, if applying $f$ again would cause the value to shrink or stay the same, that's our final result. Otherwise, we call the widening operator on the previous value and the new, bigger value. We know that $f_{\nabla}^n$ will stabilize at some point $n = m$, since by the definition of $\nabla$ we know that repeated widening calls will eventually stabilize (there's a proof on page 226).

We know that $f(f_{\nabla}^m) \sqsubseteq f_{\nabla}^m$—otherwise, the second clause wouldn't have kicked in and we wouldn't have stabilized—and since Tarski's theorem states $lfp(f) \sqsubseteq f_{\nabla}^m$, we take thisvalue as our safe approximation of $lfp(f)$, written as $lfp_{\nabla}(f) = f_{\nabla}^m$.

## Narrowing

With an upper approximation $f_{\nabla}^m$ in hand, since $f$ is reductive at $f_{\nabla}^m$, we can start going back down to try to find a least fixed point. Now, we don't know if we'll ever stop going down, but we can go down and have a termination condition! The **narrowing** operation $\Delta$ encodes this operation, as must satisfy two conditions:

- $x \sqsubseteq y \implies x \sqsubseteq (x \Delta y) \sqsubseteq y$
	- $\Delta$ gives us something less than $y$, but not less than $x$.
- For decreasing chains $x_{0} \sqsupseteq x_{1} \sqsupseteq \cdots$, the chain $(x_{n}^\Delta)_{n}$ eventually stabilizes
	- Note that $x_{n}^\Delta$ refers to the single element. With the extra parens refers to the whole sequence.

We can now construct a new sequence $[f]_{\Delta}^n$, where we start at $f_{\nabla}^m$ and call $f$ with the narrowing operation repeatedly: $$ \begin{aligned}
{[f]}_{\Delta}^n &= f_{\nabla}^m &&\text{if } n = 0 \\
&= [f]_{\Delta}^{n - 1} \Delta f([f]_{\Delta}^{n - 1}) &&\text{otherwise} \\
\end{aligned} $$
We can prove that this is a descending chain that always stays entirely inside $Red(f)$ (and so by definition, $lfp(f) \sqsubseteq [f]_{\Delta}^n$). This is different than what $\nabla$ does! $\nabla$ may step outside of $Ext(f)$ to end up in $Red(f)$.

At some point $m'$, this too will converge, since $\Delta$ converges. At this point, our approximation is complete: $$ lfp_{\nabla}^\Delta(f) = [f]_{\Delta}^{m'} $$

> [!example]
> Our narrowing operator. $$ [a, b] \Delta [c, d] = [\operatorname{if}(a = -\infty, c, a), \operatorname{if}(b = +\infty, d, b)] $$
> If we see infinity in the first argument, use the second.

## Some extras

if we have $(L, \alpha, \gamma, M)$, with monotone functions $f : L \to L$, $g : M \to M$ and $\alpha \circ f \circ \gamma \sqsubseteq g$, we have: $$ g(m) \sqsubseteq m \implies f(\gamma(m)) \sqsubseteq \gamma(m) $$
Thus, $lfp(f) \sqsubseteq \gamma(lfp(g))$ and $\alpha(lfp(f)) \sqsubseteq lfp(g)$. We have transitivity of fixed points.

Additionally, if we have a Galois insertion $(L, \alpha, \gamma, M)$ such that $\gamma(\bot_{M}) = \bot_{L}$, and if we have widening operator $\nabla_{M} : M \times M \to M$, we can get a widening operator $\nabla_{L} : L \times L \to L$ as follows: $$ l_{1} \nabla_{L} l_{2} = \gamma(\alpha(l_{1}) \nabla_{M} \alpha(l_{2})) $$
Additionally, we have: $$ lfp_{\nabla_{L}}(f) = \gamma(lfp_{\nabla_{M}}(\alpha \circ f \circ \gamma)) $$

# Trace semantics, hierarchies of semantics

> [!note] See also
> [Cousot's paper](https://www.di.ens.fr/~cousot/COUSOTpapers/publications.www/Cousot-LNCS2000-sv-sb.pdf) on abstract interpretation.

Abstract interpretation is basically picking a general domain to model precise semantics. This diagram shows the different levels of modeling semantics:

![[Screenshot 2024-08-24 at 12.06.09 PM.png]]

**Trace semantics** is literally recording program state at every point. This goes all the way up to **Hoare logics** (i.e., [[winskelWinskelAxiomaticSemantics1993|axiomatic semantics]]), where we only know about properties that hold before/after a command executes.

Different semantics say different things about what our program does.