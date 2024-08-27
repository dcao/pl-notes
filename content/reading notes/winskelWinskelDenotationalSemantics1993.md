---
aliases:
  - "Winskel 5: The denotational semantics of Imp"
tags:
  - reading
  - semantics
year: 1993
bookauthors:
  - Winskel, Glenn
status: Todo
related:
  - "[[winskelFormalSemanticsProgramming1993]]"
itemType: bookSection
publisher: MIT Press
location: Cambridge, Mass
ISBN: 978-0-262-23169-5
scheduled: 2024-07-02
---
# IMP: a simple imperative language

Before we begin, we need to define a simple imperative language used by the book, termed **IMP**. This language features assignment of numerical expressions to mutable reference locations.

Imp's syntax:

```ebnf
a = n | X | a0 + a1 | a0 - a1 | a0 * a1  (* math expr, num lit, or location *)
b = true | false | a0 = a1 | a0 <= a1    (* booleans *)
  | not(b) | b0 and b1 | b0 or b1 sd 
c = skip | X := a | c0; c1 | if b        (* statements *)
```

`c` is "commands"

# Who cares about denotational semantics

- It can handle a bunch of PLs (though not parallelism and "fairness")
- We can compare what different PLs can do; if they can represent similar programs
- We want to directly define what commands are equivalent.

# A denotational semantics for IMP

In the operational semantics for IMP, the single-step evaluation relation on arithmetic exprs (`a`/`Aexp`) (exprs of metavar `c`) is defined as a function that takes a command and a state and returns a natural number. The relation on booleans returns a `Bool`, and the relation on commands returns a new state, where a state $\sigma : Loc \to \mathbb{N}$ maps from locations to the natural numbers. It's our reference state, basically. $\Sigma$ stands for the set of all possible states $\sigma$.

In this setting, let the **denotation** (i.e., meaning) of an arithmetic expression $a \in Aexp$ be a function that takes a state and returns a natural number: $\mathcal{A}[\![a]\!] : \Sigma \to \mathcal{N}$. Alternatively, you could think of $\mathcal{A}$ as a function of type $Aexp \to (\Sigma \to \mathcal{N})$, taking in some expression in our language and returning a function that corresponds to that expression's *meaning*

Similarly, a boolean expression $b \in Bexp$ denotes a function $\mathcal{B}[\![b]\!] : \Sigma \to Bool$, and a command $c \in Com$ denotes a function $\mathcal{C}[\![c]\!] : \Sigma \to \Sigma$.

> [!note] On the brackets
> Denotational semantics girlies love their double brackets $[\![whee!]\!]$. This is to denote that the expression inside the double brackets shouldn't be evaluated—essentially a kind of quasiquoting that can also contain metavariables!

To actually define these functions, we do induction.
$$ \begin{aligned}
\mathcal{A}[\![n]\!] &= \{ (\sigma, n) \mid \sigma \in \Sigma \} \\
\mathcal{A}[\![X]\!] &= \{ (\sigma, \sigma(X) \mid \sigma in \Sigma) \} \\
\mathcal{A}[\![a_{0} + a_{1}]\!] &= \{ (\sigma, n_{0} + n_{1}) \mid (\sigma, n_{0}) \in \mathcal{A}[\![a_{0}]\!], (\sigma, n_{1}) \in \mathcal{A}[\![a_{1}]\!] \} \\
\end{aligned} $$
Notice that we define partial functions via set/relation on pairs syntax. $\{ (a, b) \in x \}$ means that $x(a) = b$. Boolean expressions $b \in Bexp$ are fairly straightforward too.

For commands $c \in Cexp$, it's slightly more complicated. The first few steps are pretty straightforward:
$$ \begin{aligned}
\mathcal{C}[\![skip]\!] &= \{ (\sigma, \sigma) \mid \sigma \in \Sigma \} \\
\mathcal{C}[\![X := a]\!] &= \{ (\sigma, \sigma[X \mapsto n]) \mid \sigma \in \Sigma, n = \mathcal{A}[\![a]\!](\sigma) \} \\
\end{aligned} $$

Composition is a little funky. Let's say we have two statements $c_{0}; c_{1}$, where $c_{0}$ maps from state $\sigma_{1} \to \sigma_{2}$ and $c_{1}$ maps from $\sigma_{2} \to \sigma_{3}$. This set of statements as a whole should map $\sigma_{1} \to \sigma_{3}$, which we get by composing $c_{1} \circ c_{0}$.

For if statements, the function depends on if the boolean is true or not:
$$ \begin{aligned}
\mathcal{C}[\![\verb|if|\ b\ \verb|then|\ c_{0}\ \verb|else|\ c_{1}]\!] &= \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = true, (\sigma, \sigma') \in \mathcal{C}[\![c_{0}]\!] \} \\
&\cup \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = false, (\sigma, \sigma') \in \mathcal{C}[\![c_{1}]\!]\} \\
\end{aligned}
$$

For while loops, things get a little dicey. For a while expression $w \equiv \verb|while|\ b\ \verb|do|\ c$, this is the same as $\verb|if|\ b\ \verb|then|\ c; w\ \verb|else skip|$ (a recursive definition)! Thus, we can define `while`'s denotation in terms of `if`, giving us an *equation* for the denotational semantics of $w$: $$ \begin{aligned}
\mathcal{C}[\![w]\!] &= \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = t, (\sigma, \sigma') \in \mathcal{C}[\![c; w]\!] \}
\cup \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = f, (\sigma, \sigma') \in \mathcal{C}[\![w]\!] \} \\
&= \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = t, (\sigma, \sigma') \in \mathcal{C}[\![w]\!] \circ \mathcal{C}[\![c]\!] \}
\cup \{ (\sigma, \sigma') \mid \mathcal{B}[\![b]\!](\sigma) = f, (\sigma, \sigma') \in \mathcal{C}[\![w]\!] \circ \mathcal{C}[\![c]\!] \}
\end{aligned} $$
This gives us an *equation* that we can solve to figure out what $\mathcal{C}[\![w]\!]$ should be. To clean this up slightly, the book substitutes $\gamma = \mathcal{C}[\![w]\!], \beta = \mathcal{B}[\![b]\!]$, and $\gamma = \mathcal{C}[\![c]\!]$: ![[Screenshot 2024-07-03 at 12.16.48 AM.png]]

With this, we can then define a function $\Gamma$ that takes a value $\varphi$ (corresponding to $n$ while loop iterations) as its input, and returns the value of $\varphi$ at iteration $n + 1$ as its output: ![[Screenshot 2024-07-03 at 12.18.43 AM.png]]

So now we no longer have recursion, but generating "layers" or "stages" of whiles.  $\varphi$ is iter 0, $\Gamma(\varphi)$ is iter 1, $\Gamma(\Gamma(\varphi))$ is iter 2, etc. So we just define $\mathcal{C}[\![\verb|while|\ b\ \verb|do|\ c]\!] = fix(\Gamma)$.

# Proving this is equivalent with operational semantics

For $Aexp$ and $Bexp$, it's sufficient to do induction on the expression. For $Com$, we show $\langle c, \sigma \rangle \to \sigma' \implies (\sigma, \sigma') \in \mathcal{C}[\![c]\!]$ through rule induction on operational semantics of commands, and we show the reverse direction through structural induction on commands.

# Complete partial orders and continuous functions

From this point on, notes are moved to [[denotational semantics and domain theory]] since I need to synthesize hella different documents to figure out what's going on lmao
