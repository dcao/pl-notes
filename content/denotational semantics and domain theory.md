This is a note on *denotational semantics*, undergirded by an extended exploration of *domain theory*, which provides the theoretical underpinning for the former.

## References

This explanation incorporates notes from the following sources: ^k6rbuu

- [[winskelWinskelDenotationalSemantics1993|Winskel 5: The denotational semantics of Imp]]
- [[winskelWinskelAxiomaticSemantics1993|Winskel 6, 7, 8: Axiomatic semantics and domain theory]], specifically §8
- Winskel's [[winskelLectureNotesDenotational2005|Lecture Notes on Denotational Semantics for Part II of the Computer Science Tripos]]
- [[mitchellModelsTypedCalculus1996|Models of Typed Calculus]], from Mitchell's *Foundations for Programming Languages*
- [this answer on PL StackExchange](https://langdev.stackexchange.com/questions/1953/how-can-we-define-a-denotational-semantics-for-recursive-functions)
- Necula, [[CS 263 - Introduction to Denotational Semantics]]

For a basic definition of and explainer of denotational semantics, see [[winskelWinskelDenotationalSemantics1993|Winskel 5: The denotational semantics of Imp]] and [this other StackExchange answer](https://langdev.stackexchange.com/questions/2019/what-are-denotational-semantics-and-what-are-they-useful-for). These notes onwards go over dealing with recursive constructs in denotational semantics with domain theory and partial orders.

# Dealing with recursive constructs

In [[winskelWinskelDenotationalSemantics1993#A denotational semantics for IMP|A denotational semantics for IMP]], we defined the denotation for `while` in terms of a *recursive equation*, that we resolved by finding the *fixed point of operators on sets*—in this case, the fixed point of repeated set unions. In particular, we defined an operation $\Gamma$ that returns the value of $\mathcal{C}[\![w]\!]$ for some while expression $w$ after $n + 1$ iterations, given the value of $\mathcal{C}[\![w]\!]$ after $n$ iterations.

The proof for showing that such a fixed point exists at all involves showing that every time we call $\Gamma(\varphi)$, the set we get back is either equal to $\varphi$ or a *superset* of $\varphi$. Since our sets actually represent functions, this means that given $\varphi$, $\Gamma(\varphi)$ must be defined on more inputs than $\varphi$ is; if $\Gamma(\varphi)(x) = y$, then $\varphi(x) = y$ or $\bot$ (i.e., the function is undefined on that input). You could also say that $\Gamma(\varphi)$ has *more information* than $\varphi$, since it's defined on more inputs. Since the solution is the (minimal) fixpoint of this operation, we can say that the solution is whatever function the set represents that contains more information than $\varphi$ and $\Gamma(\varphi)$ and $\Gamma(\Gamma(\varphi))$ and ...

In this case, we could get away of seeing the semantics of `while` as the fixed point of doing a bunch of set unions. However, this will not always be possible:

> In Section 5.4 we shall introduce a general theory of fixed points, which makes sense when the objects defined recursively are not sets ordered by inclusion.

More generally, we're not just interested in sets. What we're actually interested in is some notion of some function having *more or less information* than another function. And actually since the denotation of some syntax might be any mathematical object, not just a function, we're interested in the general notion of a *mathematical object* having *more or less information* than another object.

This general notion of information-having is a **partial ordering**, which is defined and dealt with in a branch of abstract math called **domain theory**. Domain theory gives us the language to generalize the idea of "using fixpoints to find sets that denote recursive constructs" beyond just sets, but to any mathematical object that might denote some construct in a language of our choosing. The lecture notes summarize the key insight behind this perspective:

> The key idea is to consider a partial order between the mathematical objects used as denotations—this partial order expresses the fact that one object is approximated by, or carries more information than, or is more well-defined than another one below it in the ordering. Then the minimal solution of a fixpoint equation can be constructed as the limit of an increasing chain of approximations to the solution. ([[winskelLectureNotesDenotational2005|Lecture notes]], 4)

Basically, we create a *partial ordering* between functions that provides mathematical structure for this intuition of "having more information." Then, we create a chain of partial orderings (analogous to the $\gamma, \Gamma(\gamma), \ldots$ business from before) corresponding to increasing recursive iterations. Finally, in the limit, this will approach some minimal set that has more information than all the recursive calls in the chain. This definition doesn't rely on set operations, but on a more general operation (partial ordering) that operates on functions and other "mathematical objects" that we deal with in denotational semantics.

# Partial orders in the abstract

First, let's define partial orders in the abstract. This won't have much meaning for now, but trust me, we'll see how these operations become useful and can become imbued with meaning in the next sections. Like monads!

A partial order $\sqsubseteq$ on a set $X$ is an operation that must fulfill three key properties:

- *Reflexivity*: $d \sqsubseteq d$
- *Transitivity*: $a \sqsubseteq b \land b \sqsubseteq c \implies a \sqsubseteq c$
- *Anti-symmetry*: $a \sqsubseteq b \land b \sqsubseteq a \implies a = a$

# Domain theory in a worked example

Let's walk through how we might find the denotation for a while loop that calculates the factorial of a number `n`:

```
x = n
y = 1

while x > 0:
	y = x * y
	x = x - 1
```

In this case, our state $\Sigma$ is a pair $(x, y) : \mathbb{Z} \times \mathbb{Z}$, and the denotation of this while loop is a function from pairs of integers to pairs of integers. Let's define a function $f$ that takes a state function $(\mathbb{Z} \times \mathbb{Z}) \to (\mathbb{Z} \times \mathbb{Z})$ and returns a new state function:
$$ \begin{aligned}
f(w)(x, y) &= (x, y) &\text{if } x \leq 0 \\
f(w)(x, y) &= w(x - 1, x * y) &\text{if } x > 0 \\
\end{aligned} $$
This function is analogous to $\Gamma$ from the [[winskelWinskelDenotationalSemantics1993|Winskel 5: The denotational semantics of Imp]] notes. We're trying to find a state function $w$ such that $f(w) = w$. For notation, we define $w_{n}$ as:
$$ \begin{aligned}
w_{0} &\stackrel{\text{def}}{=} \bot \\
w_{n+1} &\stackrel{\text{def}}{=} f(w_{n}) \\
\end{aligned} $$
Basically, $w_{n}$ is the denotation of the while loop after a maximum of $n$ iterations. For example, with just one evaluation of the condition of the while loop, we can only return a result if x is already 0:
$$ \begin{aligned}
w_{1}(x, y) = f(\bot)(x, y) &= (x, y) &&\text{if } x \leq 0 \\
&= \text{undefined} &&\text{otherwise} \\
\end{aligned} $$
This is because we can't call $w$, but we can return a result. With max one run of the loop body, we can return a result if $x$ is 0 or 1:
$$ \begin{aligned}
w_{2}(x, y) = f(\bot)(x, y) &= (x, y) &&\text{if } x \leq 0 \\
w_{2}(x, y) = f(\bot)(x, y) &= w_{1}(x - 1, y) = (0, y) &&\text{if } x = 1 \\
&= \text{undefined} &&\text{otherwise} \\
\end{aligned} $$
And so on. In general, we have:
$$ \begin{aligned}
w_{n}(x, y) &= (x, y) &&\text{if } x \leq 0 \\
&= (0, (x! * y)) &&\text{if } 0 < x < n \\
&= \text{undefined} &&\text{otherwise} \\
\end{aligned} $$

## Bringing back partial orderings

If we're looking at these functions, we can intuit that $w_{m}$ has *more information* than $w_{n}$ if $m > n$. We encode this notion in the partial ordering operator. The **partially ordered set** (i.e., **poset**) of state functions $(\Sigma, \sqsubseteq)$ consists of the *underlying set* of state functions $\Sigma$ and the $\sqsubseteq$ operation. For these functions, $w \sqsubseteq w'$ if and only if: $$\forall (x, y) \in \Sigma. w(x, y) \neq \bot \implies w'(x, y) \neq \bot \land w'(x, y) = w(x, y)$$
In other words, $w'$ must be defined in at least all the places $w$ is, and must have the same values that $w$ has. However, $w'$ can be *more* defined.

Let's do some more abstract definitions. Given a poset $D$ and a subset $S \subseteq D$, an element $d \in S$ is the **least element** of $S$ if $\forall x \in S. d \sqsubseteq x$. Because $\sqsubseteq$ is anti-symmetric, $S$ has at most **one** least element. Additionally, the least element of a subset might not exist! The least element of the whole set $D$ is the *bottom* element of a set, written $\bot_{D}$ for a set $D$, or just $\bot$ when the set can be inferred.

A countable, increasing **chain** in a poset $D$ is a sequence of elements of $D$ satisfying:
$$ d_{0} \sqsubseteq d_{1} \sqsubseteq d_{2} \sqsubseteq \cdots $$
These elements do not have to necessarily be distinct! It could be one element repeating forever if we wanted to.

An *upper bound* for the chain is any $d \in D$ where $\forall n \in \mathbb{N}. d_{n} \sqsubseteq d$. if it exists, the **least upper bound** (i.e., **lub**) is written as: $$ \bigsqcup_{n \geq 0} d_{n} $$
Our definition of $w_{n}$ above is the lub of the chain of functions $w_{0}, w_{1}, \dots, w_{n}$! ^p8q4xi

A **complete partial order** (i.e., **cpo**) is a poset where every chain has a lub. For instance, the poset $(\mathbb{N}, \leq)$ isn't a cpo, since there's no lub for the chain $1 \leq 2 \leq \cdots$. ^p3ai2j

A **domain** is a cpo with a bottom element. i.e., it's not just that every chain has a lub, but the whole set has an element that is "smaller than or equal to" all others. Hence, *domain theory*!

Now, let's start talking about functions operating on cpos, like our function $f$ above! A function $f : D \to E$ between cpos $D$ and $E$ can have several properties:

- **Monotonicity**: the function preserves partial ordering. $$ \forall d, d' \in D. d \sqsubseteq d' \implies f(d) \sqsubseteq f(d') $$ ^swg177
- **Continuity**: for all chains in $D$, the lub of function calls of elements in a chain is the same as calling the function on the lub. $$ \bigsqcup_{n \in \omega} f(d_{n}) = f(\bigsqcup_{n \in \omega} d_{n}) $$ ^z1lonl
- **Strictness**: if $D$ and $E$ have least elements, then $f$ must return $\bot$ when passed $\bot$: $$ f(\bot) = \bot $$

> [!example]
> Let's consider the domain of natural numbers with an additional "top" element $\omega$. If we define a function $f(n) = 0, f(\omega) = \omega$, it's monotonic ($\forall n. n \sqsubseteq \omega$, and $\forall n. f(n) = 0 \sqsubseteq \omega = f(\omega)$) and strict, but isn't continuous. Consider the chain consisting of all natural numbers (but not $\omega$ itself) The lub of the chain of all natural numbers is straightforwardly $\omega$, so $f(\sqcup_{n \geq 0}) = f(\omega) = \omega$. However, when evaluating $\sqcup_{n \geq 0} f(n)$, $f$ will always return $0$ (infinity is weird). Thus, we have $\sqcup_{n \geq 0} 0 = 0$, and $0 \neq \omega$.

## Tarski's fixed point theorem

A **fixed point** of a function $f : D \to D$ is an element $d \in D$ such that $f(d) = d$.

The **pre-fixed point** of a function $f : D \to D$ on a poset $D$ is an element $d \in D$ s.t. $f(d) \sqsubseteq d$. Note that the function application is on the left side; the result of applying $f$ will be "less" than the argument. The **least pre-fixed point** of $f$, if it exists, is written $fix(f)$. This least pre-fixed point will have two properties:

- $f(fix(f)) \sqsubseteq fix(f)$ (by definition, set $d = fix(f)$)
- $f(d) \sqsubseteq d \implies fix(f) \sqsubseteq d$ (since the fixed point is on the left side)

It's important to note that the least pre-fixed point its itself a *fixed point*: $f(fix(f)) = fix(f)$ (the proof is in [[winskelLectureNotesDenotational2005|Lecture notes]] p. 16). It is thus the least of all fixed points of $f$.

**Tarski's fixed point theorem** states that a continuous function $f : D \to D$ on a domain $D$ **will** have a pre-fixed point with the following definition: $$ fix(f) = \bigsqcup_{n \geq 0} f^n(\bot) $$
Additionally, since $fix(f)$ is a fixed point of $f$, so it is the *least fixed point* of $f$.

This theorem allows us to give denotational semantics for programs with recursive features! We can prove that a recursive function $f$ has a fixed point $fix(f)$ if it's continuous and operating on any domain $D$, which our set of state functions is (I'm not showing that here I'm tired).

Go team!

# Domain theory, and operations therein

Now, we take a more abstract lens, focusing on domain theory. Let's start with denotational semantics' connection to *domains*:

> In denotational semantics a programming construct (like a command, or an expression) is given a meaning by assigning to it an element in a "domain" of possible meanings. The programming construct is said to denote the element and the element to be a denotation of the construct. For example, commands in IMP are denoted by elements from the "domain" of partial functions, while numerals in IMP can denote elements of $\mathbb{N}$. ([[winskelWinskelAxiomaticSemantics1993|Winskel 119]])

And why do we need domain theory and, in particular, partial orders?

> As the denotational semantics of IMP in Chapter 5 makes clear it can sometimes be necessary for "domains" to carry enough structure that they enable the solution of recursive equations. ([[winskelWinskelAxiomaticSemantics1993|Winskel 119]])

Winskel §8 continues with redefinitions of [[denotational semantics and domain theory#^p3ai2j|cpos]], [[denotational semantics and domain theory#^swg177|monotonicity]], and [[denotational semantics and domain theory#^z1lonl|continuity]]. When we want to use domains for expressing (recursive) programming constructs, we want cpos and monotonic, continuous functions on those cpos, since recursive constructs can only be expressed in terms of cpos.

> [!definition] Isomorphisms
> Before we get going, we quickly formally define an **isomorphism**. Given two cpos $D$ and $E$, a function $f: D \to E$ is an isomorphism iff $f$ is a 1-1 correspondence such that $$ x \sqsubseteq_{D} y \iff f(x) \sqsubseteq_{E} f(y) $$
> This is monotonicity across domains. Basically, if an isomorphism exists between $D$ and $E$, they are isomorphic and are basically "equivalent" down to renaming.

## Discrete domains

A **discrete** cpo is a set where the partial ordering relation is the *identity*. A chain of partial orderings is just the same element repeated over and over again. Basic values—bools, ints—form discrete cpos. Any function from a discrete cpo to another cpo is continuous.

## Products

Let $D_{1}, \cdots, D_{k}$ be cpos. The underlying set of their **product** is: $$ D_{1} \times \cdots \times D_{k} $$
which consists of $k$-tuples $(d_{1}, \dots, d_{k})$ for $d_{1} \in D_{1}, \dots, d_{k} \in D_{k}$.

The partial ordering operation is done element-wise: $$ (d_{1}, \dots, d_{k}) \sqsubseteq (d_{1}', \dots, d_{k}') \stackrel{\text{def}}{=} d_{1} \sqsubseteq_{1} \land \cdots \land d_{2} \sqsubseteq_{2} d_{k}' $$

Lubs of chains are also calculated componentwise. The product of cpos is a cpo.

The **projection function** $\pi_{i} : D_{1} \times \cdots \times D_{k} \to D_{i}$ is continuous.

We can *tuple functions* too. Given $f_{1} : E \to D_{1}, \dots, f_{k} : E \to D_{k}$, we can define the function: $$ \langle f_{1}, \dots, f_{k} \rangle : E \to D_{1} \times \cdots \times D_{k} $$
This function is monotonic.

We can define the product of functions $f_{1} \times \cdots \times f_{k} : D_{1} \times \cdots \times D_{k} \to E_{1} \times \cdots \times E_{k}$. This is continuous.

### Properties on general functions on products

- If $f$ is a function from a cpo to a product of cpos, it's monotonic/continuous iff $\pi_{i} \circ f$ is monotonic/continuous for all $i$.
- If $f$ is a function from a product of cpos to a cpo, it's monotonic/continuous iff it's monotonic/continuous in each argument separately (i.e., with respect to each argument, while keeping others constant). $$ \begin{aligned}
\forall d, d' \in D, e \in E. d \sqsubseteq d' &\implies f(d, e) \sqsubseteq f(d', e) \\
\forall d \in D, e, e' \in E. e \sqsubseteq e' &\implies f(d, e) \sqsubseteq f(d, e') \\
\end{aligned} $$
- This basically let's us do commutativity: ![[Screenshot 2024-07-18 at 7.09.35 PM.png]]

## Functions

The set of continuous functions of type $D \to E$ between two cpos is a cpo! This set is written as $[D \to E]$, and partial ordering is defined as: $$ f \sqsubseteq f' \stackrel{\text{def}}{=} f(d) \sqsubseteq_{E} f'(d) $$
Application $apply : [D \to E] \times D \to E$ and currying $curry : (F \times D \to E) \to F \to [D \to E]$ are continuous. The fixpoint operator is continuous.

## Flat domains

To model ground types like $Nat$ and $Bool$, we use **flat domains**, which is a discrete domain augmented with a bottom value $\bot$. Formally, given some discrete cpo $X$, let $X_{\bot} = X \cup \{ \bot \}$. Then, we define partial ordering as: $$ d \sqsubseteq d' \stackrel{\text{def}}{=} (d = d') \lor (d = \bot) $$

Thus, $\forall d. \bot \sqsubseteq d$. This is also called a *lifted cpo* by [[winskelWinskelAxiomaticSemantics1993|Winskel §8]].

## Sums

Finally, we can form disjoint unions of cpo's. Let $D_{1}, \dots, D_{k}$ be cpos. A sum $D_{1} + \cdots + D_{k}$ is defined by the set: $$ \{ in_{i}(d_{i}) \mid d_{1} -in D_{1} \} \cup \cdots \cup \{ in_{k}(d_{k}) \mid d_{k} in D_{k} \} $$and partial order $$ \begin{aligned}
d \sqsubseteq d'\ \text{iff}\ &(\exists d_{1}, d_{1}' \in D_{1}. d = in_{1}(d_{1}) \land d' = in_{1}(d_{1}') \land d_{1} \sqsubseteq d_{1}')\ \text{or} \\
&\vdots \\
&(\exists d_{k}, d_{k}' \in D_{k}. d = in_{k}(d_{k}) \land d' = in_{k}(d_{k}') \land d_{k} \sqsubseteq d_{k}')
\end{aligned} $$

This relies on *injection functions* $in_{1}, \dots, in_{j}$ which are 1-1 such that $$\forall d \in D_{i}, d' \in D_{j}. i \neq j \implies in_{i}(d) \neq in_{j}(d')$$

We can combine $f_{1} : D_{1} \to E, \dots, f_{k} : D_{k} \to E$ into a single continuous function: $$[f_{1}, \dots, f_{k}] : D_{1} + \cdots + D_{k} \to E$$

> [!danger] TODO
> There are lots of proofs that I'm eliding here, particularly proofs of function continuity and monotonicity. Be wary.