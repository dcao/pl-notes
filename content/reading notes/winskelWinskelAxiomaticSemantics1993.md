---
aliases:
  - "Winskel 6, 7, 8: Axiomatic semantics and domain theory"
tags:
  - reading
  - semantics
year: 1993
bookauthors:
  - Winskel, Glynn
status: Todo
related:
  - "[[winskelFormalSemanticsProgramming1993]]"
itemType: bookSection
publisher: MIT Press
location: Cambridge, Mass
ISBN: 978-0-262-23169-5
scheduled: 2024-07-17
---
# § 6. The axiomatic semantics of IMP

> [!note] Other reading
> There are a lot of connections with [[CS 264 Notes#Introduction to Program Verification ==9/6== ==9/11==]]. Look at that too!

Axiomatic semantics is fitted for proving that a program written in a language does what we require of it. It's called axiomatic semantics since we are explaining the meaning of programs by stating rules saying how to prove properties of the construct. To create a formal proof system for proving properties of programs, we're gonna use **Hoare rules**! Let's fucking go!!

Just as an overview, since we touched on Hoare rules (i.e., *Hoare triples*) in [[CS 264 Notes#^9a4f4c]]. A Hoare rule for **partial correctness** $\{ A \}c\{ B \}$ means that executing the command $c$ when the assertion $A$ holds true will result in $B$ holding true with the new execution state. This only holds if $c$ terminates. With **total correctness** $[A]c[B]$, we require that $c$ terminates.

Additionally, we say $\sigma \models A$ if the predicate $A$ holds under state $\sigma$. See [[CS 264 Notes#^85dbe6]].

> [!note] On bottom
> As convention, we can write $\mathcal{C}[\![c]\!]\sigma = \bot$ if it is undefined. We can also adopt the convention that $\bot \models A$, we can describe the meaning of $\{ A \}c\{ B \}$ as:
$$
\forall \sigma \in \Sigma. \sigma \models A \implies \mathcal{C}[\![c]\!]\sigma \models B
$$

To explain this, we go through an example of defining axiomatic semantics for IMP.

## Formally defining assertions and Hoare rules

For the assertion language for `IMP` programs, we extend boolean expressions `Bexp` with universal and existential quantifiers. We also extend arithmetic expressions with arbitrary (free) integer variables; this class is called `Aexpv` by the literature.

Interpreting these expressions now requires both a state $\sigma$ mapping variables to values, and an interpretation $I$ mapping free variables to nats:

![[Screenshot 2024-07-17 at 10.53.44 PM.png]]

This is a denotational semantics.

> [!note] Notation for substitutions
> Their syntax for substitutions is $B[a/X]$, which should be read $B[X \mapsto a]$.

### The meaning of assertions

This is a more axiomatic definition, where we directly define those states which satisfy an assertion. We define the operation $\sigma \models^I A$, meaning that $A$ holds under state $\sigma$ and interpretation $I$. This is structurally recursively defined:

![[Screenshot 2024-07-17 at 10.56.20 PM.png]]

The **extension** of an assertion $A$ is the set of states (including $\bot$, denoting a nonterminating computation) that satisfies $A$ with respect to an interpretation:
$$
A^I = \{ \sigma \in \Sigma_{\bot} \mid \sigma \models^I A \}
$$

### Partial correctness

Now, we can define a Hoare rule $\{ A \}c\{ B \}$ as follows:
$$
\sigma \models^I \{ A \}c\{ B \}\ \iff (\sigma \models^I A \implies \mathcal{C}[\![c]\!]\sigma \models^I B)
$$
with respect to some interpretation $I$.

### Validity

We define the following operation:
$$
\models \{ A \}c\{ B \}
$$

This means that the Hoare rule holds for all states and interpretations. In general, $A$ is valid iff $\models A$.

## Axiomatic semantics

When we define axiomatic semantics for commands, we present them in the form of inference rules, since axiomatic semantics are meant to help us prove properties about programs!

![[Screenshot 2024-07-17 at 11.05.19 PM.png]]

These are the same rules as discussed in [[CS 264 Notes#Introduction to Program Verification ==9/6== ==9/11==]]; specifically [[CS 264 Notes#^8a9qz6]].

> [!note] $\vdash \{ A \}c\{ B \}$ versus $\models \{ A \}c\{ B \}$
> Since these are rules, there's a notion of derivation for Hoare rules. Derivations are *proofs*, and any conclusion of a derivation is a *theorem*. We write $\vdash \{ A \}c\{ B \}$ when it is a theorem.

## Properties

There are two properties we care about for such a logical system:

- **Soundness**: if the assumptions in the rule's premise are valid, so is its conclusion. $$\vdash \{ A \}c\{ B \} \implies \models \{ A \}c\{ B \}$$
- **Completeness**: all valid partial correctness assertions should be able to be obtained as derived theorems.

$$
\models \{ A \}c\{ B \} \implies \vdash \{ A \}c\{ B \}
$$

# § 7. Completeness of Hoare rules

> [!note] See also
> This overlaps with discussion of [[CS 264 Notes#Weakest Precondition|weakest preconditions]] from the CS 264 notes.

**Gödel's Incompleteness Theorem** states that there's no proof system for partial correctness assertions where all theorems are mechanically provable (i.e., *effective*). For instance, $\models \{ true \}c\{ false \}$ iff $c$ diverges on all states. If our proof system were effective, we'd be able to find which statements diverge, which is impossible!

However, the system from above is still complete; if a partial correctness assertion is valid, there exists a proof of it with Hoare rules.

## Weakest preconditions and expressiveness

Again, see [[CS 264 Notes#Weakest Precondition|the relevant discussion in CS 264 notes]] for more info.

In this book, the weakest precondition is defined as the *set of states* where execution of $c$ diverges or ends up in a final state satisfying $B$. Comparing to the CS 264 definition, instead of defining it as the weakest predicate, we define it as the set of states for which that weakest predicate holds. Formally, we write:
$$
wp^I[\![c, B]\!] = \{ \sigma \in \Sigma_{\bot} \mid \mathcal{C}[\![c]\!]\sigma \models^I B \}
$$
`Assn` is **expressive** iff for every command $c$ and assertion $B$ there exists a weakest precondition $A_{0}$; i.e., $\forall I. A_{0}^I = wp^I[\![c, B]\!]$.

More notation: the assertion expressing a weakest precondition is defined as:
$$
\sigma \models^I w[\![c, B]\!] \iff \mathcal{C}[\![c]\!]\sigma \models^I B
$$
for all interpretations $I$.

> [!danger] TODO
> There's a proof of Assn's expressiveness and relative completeness that follows. I've skipped it here.

## Verification conditions

See [[CS 264 Notes#^wyyakc|the CS 264 notes]] for more.

Verification conditions are a way of mechanically generating weak-ish preconditions for verifying program correctness.

![[Screenshot 2024-07-18 at 6.26.09 PM.png]]

The result of the function `vc` is a set of assertions about the properties of the program.

> [!danger] TODO
> I've also skipped the section on *Predicate transformers*; I have no idea what those are.

# § 8. Introduction to domain theory

See [[denotational semantics and domain theory]], since we need to synthesize multiple sources for this one.
