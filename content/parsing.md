---
aliases: []
---
> [!note]
> This note serves as both an index note for parsing-related Prelim study notes, as well as a resource on parsing in general.

# The parsing pipeline

> [!note] See also
> Starting to incorporate Dragon §4 and [CS 164 notes on parsing](https://inst.eecs.berkeley.edu/~cs164/fa23/notes/17-Parsing-1.html).

![[Screenshot 2024-08-08 at 1.50.42 PM.png]]

When we get our source program, we first perform **lexing** or **tokenization**: turning the source text into a flat list of tokens. The **parser** then turns these tokens into a parse tree. Don't confuse a parse tree with an AST though! A parse tree is literally the tree from parsing. For example, for a grammar for math expressions with non-terminal $E$, we might have a parse tree:

```
E -- 3
  |
  +- +
  |
  \- E -- 3
       |
       +- -
       |
       \- 2
```

whereas for the AST, we're not concerned with actually representing syntax (hence the *abstract*):

```
+ -- 3
  |
  \- - -- 3
       |
       \- 2
```

> [!note] See also
> https://en.wikipedia.org/wiki/Abstract_syntax_tree

# Types of formal grammars

> [!note] See also
> https://en.wikipedia.org/wiki/Formal_grammar

A formal grammar $G$ consists of a tuple $(N, \Sigma, P, S)$, where:

- $N$ is a set of nonterminal symbols.
- $\Sigma$ is a set of terminal symbols.
- $P$ is a set of **production rules**, each of the form: $(\Sigma \cup N)^* N (\Sigma \cup N)^* \to (\Sigma \bigcup N)^*$
	- A production rule maps at least one nonterminal, and potentially other (non)terminals, to a new set of (non)terminals.
- $S \in N$ is a distinguished **start symbol**.

There's a hierarchy (Chomsky hierarchy) of grammars, scaling from more expressivity to more computability:

- In **context-free grammars** (type 2), we only have a single non-terminal on the left-hand side. We don't need *context* to apply a rule; we only need to see a single symbol. Can be parsed with a non-deterministic pushdown automaton—a state machine with a stack. LL, LR parsing.
- In **regular grammars** (type 3), our rules can only be empty, terminal, or terminal followed by nonterminal. Can be parsed in $O(n)$ time with a finite-state machine. Regexes are *supposed* to (but don't always, with extensions) correspond to this.

The other types of grammars are less computationally tractable.

- In **context-sensitive grammars** (type 1), our rules must be in the form: $\alpha A \beta \to \alpha \gamma \beta$, where $A$ is a non-terminal and everything else is a string of symbols. We need a bounded Turing machine, where the tap is limited to the input plus two end-markers on either side.
- In a **recursively enumerable grammar** (type 0), there are no guarantees on rules. Only a Turing machine can parse this.

The point of a grammar is that we can automatically construct efficient parsers from these grammars.

## Leftmost and rightmost derivations

> [!note] See also
> Dragon §4.2.3

If we treat our production rules as rewrite rules, we can produce a *derivation*, rewriting from the start symbol to the expression we want to parse using these rewrite rules. For instance, given this grammar:

```ebnf
E = E + E | E * E | -E | (E) | id
```

We can get a *derivation* for the term $-(\mathbf{id})$ as follows: $$ E \Rightarrow -E \Rightarrow -(E) \Rightarrow -(id) $$
This derivation corresponds to the following parse-tree:

```
E
|
+- -
\- E
   |
   +- (
   +- E
   |  |
   |  \- id
   \- )
```

At each point in our derivation, we have to make two choices: which nonterminal do we replace, and which production do we use involving that nonterminal? For the first question, there are two main strategies:

- **Leftmost derivation**: always replace the leftmost non-terminal.
- **Rightmost derivation**: always replace the rightmost non-terminal.

## Recursive rules

Complex grammars often contain recursive rules. For instance, in arithmetic expressions, we have rules like $E \to E + E$. These can be categorized into two categories:

- A rule is **left recursive** if it's of the form $A \to A \alpha$ (using the same conventions for non-terminals and strings as above).
- A rule is **right recursive** if it's of the form $A \to \alpha A$.
	- $E \to E + E$ is both!

We can convert left recursive rules into right recursive rules as follows. A left recursive grammar $$ A \to A \alpha \mid \beta $$
...is equivalent to the following right recursive grammar: $$ \begin{aligned}
A &\to \beta R \\
R &\to \alpha R \mid \epsilon \\
\end{aligned} $$
The original rule is basically saying "$\beta$ followed by a bunch of $\alpha$s." We can break up $A$ into "start with $\beta$" and then encode the "some number of $\alpha$s" part in $R$.

# Parsing algorithm features

## Left-to-right

There are a number of features that a parsing algorithm can have. One such feature is the *direction* that it reads its input in. Almost all common parsing algorithms read our input left-to-right.

## Top-down vs. bottom-up

> [!note] See also
> Dragon §4.3, 4.4; https://stackoverflow.com/questions/5975741/what-is-the-difference-between-ll-and-lr-parsing
> https://www.eecis.udel.edu/~cavazos/CISC672/lectures/Lecture-13.pdf
> https://stackoverflow.com/questions/25965023/issue-with-left-recursion-in-top-down-parsing
> https://en.wikipedia.org/wiki/Shift-reduce_parser

Additionally, a parsing algorithm can construct a parse tree in one of two directions. We can either go **top-down**, constructing the tree from the root to its leaves, or we can go **bottom-up**, constructing the tree from its leaves back up to the root. Let's go through that in detail.

### Top-down

In general, in a top-down parser, we create our parse tree by applying production rules to our starting symbol (*predict*), and incrementally matching against the start of our input (*match*). Because we're trying to match against the start of our input, this results in a *leftmost derivation*. For instance, let's say we see this input:

```
4 + 2 - 4
```

A top-down parser might step in the following way:

| action                      | production  | input       |
| --------------------------- | ----------- | ----------- |
|                             | $E$         | `4 + 2 - 4` |
| Predict $E \to E - E$       | $E - E$     | `4 + 2 - 4` |
| Predict $E \to E + E$       | $E + E - E$ | `4 + 2 - 4` |
| Predict $E \to 4$ (int lit) | $4 + E - E$ | `4 + 2 - 4` |
| Match $4$                   | $+ E - E$   | `+ 2 - 4`   |
| etc.                        |             |             |

Notice that we produce leftmost derivations since we're trying to get to terminal symbols on the left-hand side ASAP so we can match against our input. Additionally, note that the algorithm has to *predict* what nonterminal rule to apply. The algorithm makes this prediction based on some number $k$ of **lookahead** tokens, looking at the first $k$ tokens of the current input to see what rules to apply to get closer to the input string.

> [!warning] Backtracking
> You can also add *backtracking* to a parser to allow it to fuck up and then go back and try another production rule. However, naïve backtracking parsers are exponential, whereas non-backtracing (i.e., *predictive*) parsers are linear, although there are ways of making backtracking non-exponential. See [[fordPackratParsingSimple2002|Packrat parsing]].

One major downside with top-down parsing approaches is that they *can't handle left recursive grammars*! Consider the following left recursive grammar that recognizes a list of `b`s:

```ebnf
A = A b | ""
```

In order to start matching, we have to predict $A \to Ab$ some number of times, then choose when to stop the sequence with $A \to \epsilon$. But we don't know how many $b$s will be in the string! Doing this requires *arbitrary* lookahead into our input string, which is untenable. Top-down approaches can only handle right-recursive grammars, where we know we can use finite lookahead because the first tokens in a rule will always be non-recursive.

### Bottom-up

By contrast, bottom-up parsing can handle *both left- and right-recursive grammars*. In a bottom-up parser, we maintain a working *stack* onto which we **shift** our input. We can then **reduce** elements on the (top of) stack using our production rules. Thus, we slowly build up more complex non-terminals starting from our terminals, thus the "bottom-up" part.

> [!note] A helpful diagram of a bottom-up parse from the Dragon book
> ![[Screenshot 2024-08-08 at 8.09.51 PM.png]]
> (p. 234)

Note that a reduction step is the *reverse* of a derivation step. In a derivation step, we go from nonterminal to terminal. Here, we start from the terminal and go backwards to a nonterminal, meaning we're doing a *reverse* derivation.

For the expression $\mathbf{id} * \mathbf{id}$ above, here's how a shift-reduce parse of that could look like:

| action                     | stack (right is top) | input       |
| -------------------------- | -------------------- | ----------- |
|                            |                      | `id1 * id2` |
| Shift                      | `id1`                | `* id2`     |
| Reduce $F \to \mathbf{id}$ | `F`                  | `* id2`     |
| Reduce $T \to F$           | `T`                  | `* id2`     |
| Shift                      | `T *`                | `id2`       |
| Shift                      | `T * id2`            |             |
| Reduce $F \to \mathbf{id}$ | `T * F`              |             |
| Reduce $T \to T * F$       | `T`                  |             |
| Reduce $E \to T$           | `E`                  |             |
| **accept**                 |                      |             |

Notice that if you read this table in reverse order, you can see our derivation of the input. Additionally, since the rightmost terminals are pushed and reduced last, when reading in reverse/derivation order, they're *derived* first. They appear as literals first in reverse order. Thus, bottom-up parsing results in a *reverse rightmost derivation*!

Keep in mind that in order to figure out what production rule to use for reduction, we still need some amount of *lookahead*. For a lookahead value $k$, we consider the symbols on the stack and the first $k$ input tokens remaining to figure out what rule to apply.

### In sum

In **bottom-up parsing**, we scan the input from left-to-right, but we produce a rightmost derivation (in reverse), which means that we repeatedly apply production rules starting from the right side of the expression, until we get to the root (start) non-terminal. Under the hood, this is implemented by keeping a *stack* of symbols (either non-terminals or straight-up symbols) we've seen so far. Basically, when we get an input, we start pushing lexed symbols onto our stack, left-to-right. If we see a production rule that is just a terminal, we immediately reduce it there. This means that the top of our stack will the rightmost lexed symbol by the end. We then iteratively reduce, looking at the top of the stack (i.e., the right) and applying progressively more complex non-terminal rules. See the Stack Overflow page for an example. This is *bottom-up* parsing: we push all of our symbols to the stack, then apply production rules from the leaves up. These parser can accept some amount of *lookahead*: what $k$ first tokens of the input to consider, along with the stack, when applying production rules.

By contrast, in **top-down parsing**, we scan the input from left-to-right, but produce a leftmost derivation, iteratively expanding production rules until we find terminals that apply to the very start of the string, then chopping the start of that string off and continuing. This is *top-down* parsing: we eagerly expand production rules and chop off our input as soon as we find a production rule that applies. Like bottom-up parsers, these parsers require some amount of *lookahead*, to be able to predict what production rules to apply.

You can imagine bottom-up parsing as a `foldr` and top-down parsing as a `foldl`.

### Tradeoffs between bottom-up and top-down

From the SO answer (replace "LL" with top-down and "LR" with bottom-up; we'll explain those in a sec):

> LL parsers tend to be easier to write by hand, but they are less powerful than LR parsers and accept a much smaller set of grammars than LR parsers do. LR parsers come in many flavors (LR(0), SLR(1), LALR(1), LR(1), IELR(1), GLR(0), etc.) and are far more powerful. They also tend to have much more complex and are almost always generated by tools like `yacc` or `bison`

# Parsing algorithms

## Recursive descent

Recursive-descent parsing is a form of top-down parsing. Here, we represent every nonterminal as a function. Each of these functions has the following structure:

```
A():
	'err: for each A-production: A -> X1 X2 ... Xk:
		for each symbol Xi:
			if Xi is nonterminal:
				Xi()
			elif Xi == current symbol a:
				advance to next symbol
			else:
				backtrack input to before any of these nonterminals were applied
				continue 'err

	return err
```

Basically, each function is responsible for trying a production rule, checking if the terminals match, and calling other nonterminal functions. Notice how left-recursive rules will fuck this up: `A` might just call `A` over and over again!

Note that above, we implemented backtracking in our function. We can categorize parsers by whether or not they backtrack:

- **Backtracking parsers** backtrack. They may execute in exponential time.
- **Predictive parsers** don't. They're guaranteed to execute in linear time.

> [!note]
> See [[fordPackratParsingSimple2002|Packrat parsing]] for a citation on the above.

### In Prolog

> [!note] See also
> This section comes entirely from [these CS 164 notes from Ras Bodik](https://homes.cs.washington.edu/~bodik/ucb/cs164/sp13/lectures/09-Datalog-CYK-Earley-sp13.pdf).

In Prolog, we might represent a recursive descent parser as follows. For every nonterminal $E$, we have a relation $e(In, Out)$. $In$ represents our input, and $Out$ represents the ending part of the input we want to ignore. Basically, this relation holds if we can derive $E$ from $In$, having chopped off $Out$ from the end.

For example, for this grammar:

```ebnf
E = T | T + E
T = F | F * T
F = a
```

We can write the following:

```prolog
e(In, Out) :- t(In, Out)
e(In, Out) :- t(In, [+|R]), e(R, Out).

% etc.

f([a|Out], Out).
```

The second line says that `E` can be parsed with two nonterminal calls. In the first case, we check the relation `t` with our full input, but have `Cons '+' R`  be the end part we want to ignore. In the very last rule for `f`, we only accept if $In$ contains one char `a` at the start versus $Out$.

## LL(1) parsing

> [!note] See also
> Dragon §4.4.3

For a specific class of grammars, we can automatically construct an efficient, predictive top-down parser. These grammars are called **LL(1)** grammars. Here, "LL(1)" stands for (l)eft-to-right input reading, (l)eftmost derivation construction, with (1) token of lookahead. A grammar $G$ is LL(1) iff whenever $A \to \alpha \mid \beta$ are two distinct productions in $G$, the following is true:

1. If they both start with terminals, they can't be the same.
2. Only one of them can derive the empty string.
3. If $\beta \overset{*}{\Rightarrow} \epsilon$, $\operatorname{first}(\alpha)$ and $\operatorname{follow}(A)$ are disjoint. The opposite is true if $\alpha \overset{*}{\Rightarrow} \epsilon$.

> [!note] What are $\operatorname{first}$ and $\operatorname{follow}$?
> For any string of grammar symbols $\alpha$, $\operatorname{first}(\alpha)$ is the set of terminal symbols that all possible strings that can be derived from $\alpha$ start with.
> 
> For a nonterminal $A$, $\operatorname{follow}(A)$ is the set of terminals $a$ that could follow $A$ in some derivation. That is, they appear in some derivation in the form: $S \overset{*}{\Rightarrow} \alpha A a \beta$.
> 
> Basically, the last rule prevents us from doing right recursion.

To parse this, we create a **parsing table** $M$ which takes a nonterminal $A$ and the current lookahead input symbol $a$, and returns a predicted production to apply at that point. We build this table as follows:

- For each terminal $a \in \operatorname{first}(\alpha)$, add $A \to \alpha$ to $M[A, a]$.
- If $\epsilon \in \operatorname{first}(\alpha)$, for each terminal $b$ in $\operatorname{follow}(A)$, add $A \to \alpha$ to $M[A, b]$. Additionally, if end of string is in $\operatorname{follow}(A)$, add $A \to \alpha$ to $M[A, end]$.

The parsing table has size $O(v \times t)$, where $v$ is the number of nonterminals and $t$ is the number of terminals. The overall time complexity of running this is linear with respect to the length of the input: $O(n)$!

Here's an example LL(1) parsing table:

![[Screenshot 2024-08-09 at 3.46.20 PM.png]]

## CYK, Earley parsing

> [!note] See also
> This section comes entirely from [these CS 164 notes from Ras Bodik](https://homes.cs.washington.edu/~bodik/ucb/cs164/sp13/lectures/09-Datalog-CYK-Earley-sp13.pdf).
> There's also this extra resource on Earley parsing: https://inst.eecs.berkeley.edu/~cs164/fa20/lectures/lecture6-2x2.pdf

These are both "famous" parsing algorithms that can handle *any* context-free grammar! 

### CYK parsing

A CYK parser is a recursive-descent parser that can recognize *any* potential context-free grammar in $O(n^3)$ time with $O(n^2)$ space, with respect to the length of the input. To explain how CYK works, we'll be speaking in Datalog terms at first, since it abstracts away some annoying detail.

At a high level, a relation $e(i, j)$ is true iff the substring `input[i:j]` (`i` inclusive, `j` exclusive) can be derived from the nonterminal $E$.

Let's start with a simple grammar:

```ebnf
E = a | E + E | E * E
```

We can express these rules with the following relation declarations:

```datalog
e(I, I + 1) :- input[I] == 'a'.
e(I, J)     :- e(I, K), input[K] == '+', e(K + 1, J).
e(I, J)     :- e(I, K), input[K] == '*', e(K + 1, J).
```

To parse an expression `a + a * a`, one possible semantics for this program is to evaluate this bottom-up:

- `e(0, 1) = e(2, 3) = e(4, 5) = true` by rule 1
- `e(0, 3) = true` by rule 2
- `e(2, 5) = true` by rule 3
- `e(0, 5) = true` by rule 2/3

> [!danger] TODO
> There's more to say on Datalog semantics; there'll be a note for that at some point.

> [!note]- Visualizing the parser in tabular form
> ![[Screenshot 2024-08-09 at 12.30.40 PM.png]]
> This is where we get $O(n^2)$ space!

The *edges* in CYK reduction correspond to the *nodes* in our parse tree.

- Edge $e = (0, N, S)$ (where $S$ can either be a nonterminal or the production rule, if you wanna be disambiguous) corresponds to the root of the tree $r$
- Edges that *caused* insertion of $e$ are children of $r$.

When actually implementing this algorithm:

- Turn everything into Chomsky Normal Form to get to $O(n^3)$ time and $O(n^2)$ space.
	- In CNF, all productions are either $A \to BC$, $A \to d$, or $S \to \epsilon$ (only start can derive $\epsilon$).
- Use dynamic programming to fill 2D array with solutions to subproblems.

### Earley parsers

> [!note] See also
> https://web.eecs.umich.edu/~weimerw/2015-4610/lectures/weimer-pl-earley-01.pdf
> https://rahul.gopinath.org/post/2021/02/06/earley-parsing/

CYK parsers may build parse subtrees that aren't part of the actual final parse tree! Some edges are extraneous.

> [!note]- An example of this
> ![[Screenshot 2024-08-09 at 12.41.56 PM.png]]

By contrast, Earley parsers have $O(n^3)$ worst-case time, but can achieve $O(n)$ for deterministic context-free grammars, and $O(n^2)$ for unambiguous context-free (i.e., **LR($k$)**) grammars. At a high level, we process the input left-to-right (and not in arbitrary order), and only reduce productions with a chance to be in the parse tree. 

The big idea here is that we go through our input left-to-right. At each point in between input tokens, we keep track of some *state*: specifically, the possible production rules we could be in the middle of right now. We keep track of these rules and where we are in those rules at each point.

As an example, let's parse the expression $\mathbf{id}_{1} + \mathbf{id}_{3} + \mathbf{id}_{5}$ with this grammar:

```ebnf
E = T + id | id
T = E
```

At the very start of the string, we might be about to process any of the nonterminals. We represent the current state of our parser with a dot $\bullet$. That might look like this: $$ \begin{aligned}
E &\to \bullet T + \mathbf{id} \\
E &\to \bullet \mathbf{id} \\
T &\to \bullet E \\
\end{aligned} $$
After going through one token, the state at that point might be as follows: $$ \begin{aligned}
E &\to T \bullet + \mathbf{id} \\
E &\to \mathbf{id} \bullet \\
T &\to E \bullet \\
\end{aligned} $$
Basically, this means that after parsing an $\mathbf{id}$, we have a complete $T$ or $E$, or we could have an in-progress $E$. We can walk through the rest of the states as follows:

| cursor before index | state                                                                                                                       | explanation                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0                   | $$ \begin{aligned} E &\to \bullet T + \mathbf{id} \\ E &\to \bullet \mathbf{id} \\ T &\to \bullet E \\ \end{aligned} $$     |                                                                                                                                                                                                           |
| 1                   | $$ \begin{aligned} E &\to T \bullet + \mathbf{id} \\ E &\to \mathbf{id} \bullet \\ T &\to E \bullet \\ \end{aligned} $$     |                                                                                                                                                                                                           |
| 2                   | $$ E \to T + \bullet \mathbf{id} $$                                                                                         | At this index, the only possibility is that we're in the middle of the longer $E$ production rule, since that's the only one that recognizes a $+$.                                                       |
| 3                   | $$ \begin{aligned} E &\to T + \mathbf{id} \bullet \\ T &\to E \bullet \\ E &\to T \bullet + \mathbf{id} \\ \end{aligned} $$ | We advance the dot from the above rule, getting us to the end of $E$. This also means that we're at the end of a $T$ rule too. Because of that, we can treat this as an in-progress parse of another $E$. |
| 4                   | $$ E \to T + \bullet \mathbf{id} $$                                                                                         | Again, here the only possibility is advancing after the $+$ in that rule.                                                                                                                                 |
| 5                   | $$ \begin{aligned} E &\to T + \mathbf{id} \bullet \\ T &\to E \bullet \\ E &\to T \bullet + \mathbf{id} \\ \end{aligned} $$ | Same as with `3`.                                                                                                                                                                                         |

By doing this, we've avoided creating extraneous edges. We didn't recognize $\mathbf{id_{3}}$ or $\mathbf{id_{5}}$ as their own `T`, and we didn't parse the expression $\mathbf{id_{3}} + \mathbf{id_{5}}$.

## Packrat

[[fordPackratParsingSimple2002|Packrat parsing]] is a way to get linear time parsing of LL($k$) and LR($k$) grammars using recursive descent in a *lazy functional programming language*. For more information, see the associated linked note.

## LR parsing

> [!note] See also
> Dragon §4.6

Covered by Earley parsing! In general, we do shift-reduce style.