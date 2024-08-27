---
aliases:
  - "TAPL 1, 3, 5, 6: Untyped lambda calculus"
tags:
  - reading
year: 2002
bookauthors:
  - Pierce, Benjamin C.
status: Todo
related: 
itemType: bookSection
book: "[[pierceTypesProgrammingLanguages2002]]"
publisher: MIT Press
location: Cambridge, Mass
ISBN: 978-0-262-16209-8
scheduled: 2024-06-12
---
> [!summary]
> **Evaluation styles**
> Call-by-name: no reductions inside abstractions. Lazy.
> Call-by-value: outermost redexes reduced, redex reduced only if right-hand side is a value. Strict.

# § 3. Syntax & semantics

## Syntax

Can be defined inductively: "the set of terms is the smallest set $T$ such that these literals are in $T$, if things are in $T$ then other things are in $T$, etc."

Can also be defined using **inference rules.** Read as: "if we have established the statements in the premise(s) listed above the line, then we may derive the conclusion below the line."

Concretely, you can define the set of terms in terms of iteratively building sets: $T_{0}$ has just the constants, $T_{1}$ has depth-one terms, etc.

You can do structural induction on terms this way (think pattern matching on ADTs in Haskell). This is commonly how induction on terms goes.

## Induction on syntax

Three kinds:

- Induction on *depth*: show $P(s)$ given $\forall r. depth(r) < depth(s) \implies P(r)$
- Induction on *size*: show $P(s)$ given $\forall r. size(r) < size(s) \implies P(r)$
- *Structural* induction: show $P(s)$ given $P(r)$ for all immediate subterms $r$ of $s$.

Normally you do case-by-case based on variant of term.

## Semantics

Three kinds:

- **Operational**: Specify an abstract (i.e., operates directly on language terms, not assembly or whatever) machine with state and transition function. *Meaning* of a term is final state of machine when it starts with that term.
 	- There are many possible operational semantics!
- **[[denotational semantics and domain theory|Denotational]]**: A term's meaning is a *mathematical object*, like a number or function. A denotational semantics is finding a collection of *semantic domains* and an *interpretation function* that goes from terms to these semantic domains. *Domain theory* is the research of finding appropriate semantic domains.
 	- Lets you find laws about programs—that programs have same behavior, that some things are impossible in a language
- **[[winskelWinskelAxiomaticSemantics1993|Axiomatic]]**: state these laws as the definition of the language itself. The meaning of a term is what can be proved about it
 	- *Invariants* come from this view.

## Evaluation

- A rule is *satisfied* by a relation if:
 	- For every instance of rule, conclusion in relation **or** a premise is *not*.
- **Evaluation relation** $t \to t'$: "`t` evaluates to `t'` in one step."
 	- The evaluation relation is the *smallest* binary relation that satisfies some set of evaluation rules.
 	- If $(t, t')$ is in this relation, then "the evaluation statement/judgment is *derivable*"
  		- i.e., we can build a derivation tree to get $t \to t'$
  		- ![[Screenshot 2024-06-14 at 2.15.58 PM.png]]
  		- ![[Screenshot 2024-06-14 at 2.15.49 PM.png]]
  		- This isn't the same as multi-step eval $t \to^* t'$!
 	- Terms evaluate to values.
 	- **All terms are ==values==**. The term syntax should include values.
- **Normal form**: most evaluated form.
 	- All values are in normal form, but not all normal forms are values (e.g., errors)
 	- Non-value normal forms are **stuck**. ^9c29eb
  		- Run-time error!
- Small-step v. **big-step**
 	- In big-step semantics, we directly say "the term $t$ evaluates to a final value $v$": $t \Downarrow v$
 	- For instance, the rule big step rule `B-IfTrue` corresponding to `E-IfTrue` would be:

$$
\begin{prooftree} \AXC{$t_{1} \Downarrow true$} \AXC{$t_{2} \Downarrow v_{2}$} \BIC{$\verb|if t1 then t2 else t3| \Downarrow v_{3}$} \end{prooftree}
$$ ^32t7q5

# § 5. Untyped lambda calculus

- Why do we care about lambda calculus?
 - You can use it to describe all computation
 - But it's simple enough to make proofs about programs
- **Abstract** and **concrete** syntax
 - Concrete/surface syntax is what the user writes
 - An AST reprs the program as a labeled tree.
 - Concrete transformed by lexer (gets tokens, ignores whitespace) and parser (turns tokens into AST)
- A **closed term** (aka *combinators*) are terms that contain no free variables.
- Operational semantics: var subst! $(\lambda x. t_{12}) t_{2} \to [x \mapsto t_{2}] t_{12}$
 - **Redex**: "reducible expression"
 - **Beta reduction**: fn eval
 - **Alpha conversion**: rename args
 - Different *evaluation strategies*:
  - Full beta-reduction: any redex can be reduced at any time
  - Normal order: leftmost, outermost redex first
  - Call-by-name: no reductions inside abstractions. Lazy.
  - Call-by-value: outermost redexes reduced, redex reduced only if right-hand side is a value. Strict.
- Multiple args via currying
- Church booleans:
 - True: $\lambda t. \lambda f. t$
 - False: $\lambda t. \lambda f. f$
 - Apply booleans to two values to do conditional selection. First element if true, second if false.
- A pair passes two values into a boolean function. `fst` passes in true, `snd` passes in false
- Church numerals: a number $n$ is a function that applies a function $s$ to a value $z$, $n$ times
 - Math proceeds as it did in CSE 230 lmao
- **Recursion**
 - The `omega` combinator evaluates to itself: `omega = (λx. x x)(λx. x x)`
 - The *fixed-point* combinator lets us `fix = λf. (λx. f (λy. x x y)) (λx. f (λy. x x y))`
- **Substitution**
 - **Variable capture**: free variables in a term becoming bound b/c of naive substitution
  - In an abstraction, we don't want to subst such that a free var becomes bound or vice versa.
  - Subst rule captures this intuition: ![[Screenshot 2024-06-18 at 11.53.18 AM.png]]
 - Normally our subst rules should be **capture-avoiding substitutions**.
- Operational semantics
 - We can formulate our operational semantics to do different eval strategies!
 - With full beta-reduction, there is no order, so we can have overlapping eval strats:
  -
$$
\frac{t_{1} \to t_{1}'}{t_{1}\ t_{2} \to t_{1}'\ t_{2}}
$$
  -
$$
\frac{t_{2} \to t_{2}'}{t_{1}\ t_{2} \to t_{1}\ t_{2}'}
$$
  -
$$
\begin{prooftree} (\lambda x. t_{12})\ t_{2} \to [x \mapsto t_{2}]\, t_{12} \end{prooftree}
$$
 - Or, we can require values in certain positions of our eval rules, to enforce diff eval strat.

# § 6. de Brujin indices, briefly

i.e., nameless representation of vars.

A bound variable is represented by how many levels up the lambda that binds this variable is. $\lambda x. \lambda y. x\ y$ becomes $\lambda.\lambda. 1\ 0$.

To represent free variables, our **naming context $\Gamma$** contains a map from free vars to de Brujin indices. For example:
$$
\Gamma = b \mapsto 0, a \mapsto 1, \dots
$$
Thus, $\lambda a. b\ x$ becomes $\lambda. 2\ 0$

We define a shift operator $\uparrow^d_{c}$ which shifts all vars $\geq c$ up by $d$. $\uparrow^d = \uparrow^d_{0}$.
