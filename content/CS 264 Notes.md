---
cssclasses: []
---
# Intro, automated test gen w/ symbolic execution

- Course goals
	- Help students start research in area of programming tools for productivity, quality, perf
		- automated testing
		- dynamic/static program analysis
		- program synthesis (woo!)
		- AI for PL/SE tools (boo)
	- Apply skills elsewhere
- Course comms
	- Class materials on bCourses
	- OH: Wed 2:30-3:30p
- Course structure
	- Discuss topic in each lecture, I'll read paper on the topic
	- Homework: will be something lol
	- Project: new research, paper?
- Course grading
	- Class participation: 30%
	- Homework: 30%
	- Project: 40%
		- New research
		- 1-2 page proj proposal by 9/18/23
		- 5-7 min mid-semester proj pres
		- Final project demo/pres
		- 6 page report in ACM SIGPLAN format
- "The bar is a bit high for this class"

## Automated test generation

- Two methods/techniques
	- Symbolic execution
	- Fuzz testing
- Tryna generate test inputs
	- As opposed to static program analysis – looks at source code and tries to ID bugs
	- IntelliJ, PyCharm, ...
	- Hard to debug since there's no concrete input
- Symbolic execution
	- Use **symbolic values** for input vars instead of concrete vals
	- Execute symbolically on symbolic input vals
	- Collect symbolic path constraints
		- e.g. when running into conditional, split into two parts, execute both paths simultaneously
		- If you hit `if (x > 0) ...`, one execution path will add the path condition `[x > 0]` (i.e. this *condition* must be met to follow this particular execution *path*), the other will add the condition `[¬(x > 0)]`, i.e. `[x ≤ 0]`
	- Use constraint solver to generate concrete inputs for each exec path
		- You know that these concrete inputs cover **all possible execution paths**
	- Execution graph
		- Represented by series of non-branching statements, followed by a branching statement
		- Branching statement causes arrows to multiple nodes
	- Introduced in 70s
	- Drawbacks: at the time SMT solvers sucked, real programs have too many paths
- Path explosion problem: path space of a large program is huge
	- Symbolic execution might only cover small part of this
	- Next week: discuss concolic execution, multi-path symbolic exec

# DART and CUTE: Concolic Testing

- Google has 10x more testing than impl code?
- Automated Test Generation - not popular til now
	- Program analysis was expensive
	- SMT solvers sucked ass
- CUTE and DART: **Concolic** execution
	- Combine random testing (concrete ex) and symbolic testing (symbolic ex)
	- Concolic = **conc**rete + symb**olic**
	- Generate test inputs, execute unit under test on generated test inputs
	- You have to provide assertions
- @ **Execution tree**: execution paths of a program
	- Binary tree w/ possibly infinite depth
	- Node is execution of an `if-then-else`
	- Edge is execution of sequence of non-conditional statements
	- Path on a tree represents equivalent class of inputs
- Existing approach: symbolic execution
	- Collect constraints tactic from last time
	- **But** doesn't scale for larger programs
	- And can still give you false positives!
		- e.g. Condition: `if (x * 2 != 7) ...`
		- This is always true, but SMT doesn't know this.
- Concolic Testing
	- Naive
		- Executes test input and executes with concrete state, **while** also keeping track of symbolic state!
			- For symbolic state, don't do the forking or anything. Just keep track of constraints, symbolic values, etc.
		- First, start with random test inputs.
		- We keep track of symbolic state so we can accumulate a path condition
		- Then, we negate parts of the path condition (to discover new paths) and use an SMT solver to generate new values according to this new path condition, that we then execute, restarting the cycle
			- As we execute, we accumulate a stack of conditions: `[x > 2, y > 3, z > 4]`
			- We negate the most recent conjunction: `[x > 2, y > 3, z ≤ 4]`
			- Once both condition and its negation have been explored, pop off the stack, negate next most recent: `[x > 2, y ≤ 3]`
				- This path may yield new conditions: `[x > 2, y ≤ 3, z < 1, w > 2]`
			- Repeat process
		- @ Benefit 1 of concolic: no need to breadth-search whole computation tree
	- Dealing with non-linear constraints
		- What if we have an assignment: `z = y * y; if (z == x) ...`
			- Path constraint: `[y * y = x]`
			- SMT solver can't deal with `y * y == x`
		- Or what if you don't have the source code for some program, or you have an opaque library fn?
			- `foo(y) == x` ??? `foo` can have side effects, ...
		- @ Another benefit of concolic: we can replace symbolic with concrete if needed
			- We've executed `foo(y) = y * y` in the concrete execution, let's say `y = 7, foo(y) = 49`.
			- Modify our path condition from `[foo(y) = x]` to `[49 = x]`.
				- This is easy to negate and find a satisfying assignment: `[49 ≠ x]`, `x = 48`
			- Caveats
				- Could miss some branches, since we're replacing symbolic with concrete value that collapses some branches to always be true/false
	- Loops
		- Have a hard stop on iters
		- We're not tryna prove universal correctness (as with theorem proving, ...)
	- Optimizations
		- ~ Simplify symbolic exprs on the fly
		- ~ Incremental constraint solving
			- Observation: one constraint negated per execution
			- $C_1 \land C_2 \land \cdots C_k$ has a satisfying assignment
			- Want to solve $C_1 \land C_2 \land \cdots \neg C_k$
			- Previous solution is probably similar!
				- Start from existing solution, solve new constraint without non-dependent constraints
				- $x = 1 \land y > 2 \land \neg (y = 4)$ to $y > 2 \land \neg (y = 4)$
- CUTE Approach
	- @ Key idea: initializing data structures on demand
		- Let's say you have constraint `[p = NULL]`, where `cell *p`
			- We're doin singly linked lists, with `struct Cell { v: i32, next: *Cell }`
		- @ Key idea: to negate, we need `[p ≠ NULL]`, thus we set `*p = Cell { v = random, next = random }`
			- Symbolic execution: $p.v = v_0$, $p.next = n_0$

# MultiSE: Multi-Path Symbolic Execution using Value Summaries

Describes symbolic execution with program semantics notation, talks about multiple paths?

- $ Goal: **automated test generation**
	- Generate arbitrary test inputs
	- Such that you explore all execution paths of a program
		- Ensures every reachable statement, incl. assertion violations, are explored

## MultiSE paper walkthrough

For the rest of these notes, we're gonna operate with the following code snippet:

```
(1)  let x = x_0
(2)  let y = y_0
(3)  let z = z_0

(4)  x = 2 * x

(5)  if (x > 100)
(6)    if (z == 1)
(7)      r = 1.3

(8)  if (r > 1)
(9)    z = r - 1

(10) halt

```

- Starts with formally defining a simple imperative language
- Next, defines semantics using [[type system notation]]
- In practice, for real-world programs, you can't explore all paths with symbolic execution
	- In practice, use heuristics to e.g. maximize branch coverage
- Before, we conceptualized the state of our symbolic execution with a table with all the different possible execution paths, and the corresponding path conditions and symbolic variable values in each case:

| path | path condition     | pc  | x    | y   | z   |
| ---- | ------------------ | --- | ---- | --- | --- |
| 1    | 2x > 100 && z == 1 | 10  | 2x_0 | y_0 | 0.3 |

- But in practice, we want to **merge the different execution states** for a few reasons
	- We want to mitigate path explosion issues
	- Symbolic execution might do redundant execution
		- Each path has to execute the same statement/conditional multiple times
- The prior state-of-the-art was to do state merging by introducing auxiliary variables at join points
	- A *join point* is when multiple states of execution converge
	- For example, at $pc = 8$, there are three different paths of execution which converge:
		- $2x_0 > 100 \land z_0 = 1$ - both conditionals taken
		- $2x_0 > 100 \land z_0 \neq 1$ - first conditional taken
		- $2x_0 \leq 100$ - no conditionals taken
	- This is a *join point*, at which we can merge these different execution states
	- In case 1, the new value of r (let's call it $r_1$) is $1.3$. In the other cases, it equals its initial value ($r_0$)
	- We can combine these path conditions into a single one via disjunction:
	- $(2x_0 > 100 \land z_0 = 1 \land r_1 = 1.3) \lor (2x_0 > 100 \land z_0 \neq 1 \land r_1 = r_0) \lor (2x_0 \leq 100 \land r_0 = 1.3)$
	- We can pretend this is one execution path!
	- But this isn't perfect either, and has some issues
		- Relies on knowing join points
- @ MultiSE's key contribution: organize symbolic state by **variables** instead of **paths**
	- Let's say you get to end of symbolic execution. You have a bunch of paths with path conditions and final values for each of your variables
	- Maybe some of the variables will have the same symbolic values 
		- Maybe $x = 2x_0$ in all execution paths, maybe the program counter ends at the same line every time.
		- In your compact state: $pc \mapsto 10$, $x \mapsto 2x_0$
	- Some variables depend on the path taken
		- Let $PC_n$ be the path condition of the $n$th path
		- $z \mapsto \{ (PC_1 \lor PC_3, r_0 - 1), \ldots \}$ means $z = r_0 - 1$ if paths 1 or 3 are taken
		- $x \mapsto \{ (true, 2x_0) \}$
	- Each of these sets of values and their guards is a *Value Summary*
	- Instead of storing symbolic execution state as a table
- How do we *incrementally **merge**/update* this state as we symbolically execute a program?
	- Let's say our value summary contains
		- $r \mapsto \{ (PC_1 \lor PC_2, r_0), (PC_3, 1.3) \}$
		- $z \mapsto \{ (true, z_0) \}$
	- We encounter the conditional `if (r > 1) z = r - 1; halt`
		- Evaluating `r > 1` with our value summary gives us another value summary!
		- $(r > 1) \mapsto \{ (PC_1 \lor PC_2, r_0 > 1), (PC_3, true) \}$
		- Thus, $r > 1$ if $PC_6 = ((PC_1 \lor PC_2) \land r_0 > 1) \lor (PC_3 \land true)$
		- The program counter $pc$ now needs to be guarded by this condition.
			- $pc \mapsto \{ (PC_6, 9), (\neg PC_6, 10) \}$
	- We now have two possible execution paths we could take. 
		- Let's start with assuming $PC_6$, thus $pc = 9$!
			- We execute `z = r - 1`
			- $r - 1 \mapsto \{ (PC_1 \lor PC_2, r_0 - 1), (PC_3, 0.3) \}$
			- There are now two cases for $z$
				- $z \mapsto \{(\neg PC_6, z_0), (PC_6, r - 1)\}$
				- Expand out $r - 1$
				- $z \mapsto \{(\neg PC_6, z_0), (PC_6 \land (PC_1 \lor PC_2), r_0 - 1), (PC_6 \land PC_3, 0.3) \}$
	- Note: **merging into our current state—list of value summaries—happens at every step of execution!**
- How is this useful for generating test inputs?
	- Let's say you start with some arbitrary assignment for your variable
	- As we step through MultiSE symbolic execution, when we hit a branch, one of the branches will be true, one will not be
	- You use the SMT solver to try to find an input that satisfies the other branch
		- If it's infeasible, you can just drop the branch from symbolic execution
- Why go through this trouble?
	- Value Summary
		- enables state sharing across different paths
		- avoids redundant execution
		- ratio of **# of paths : # of distinct symbolic exprs in value summaries** ranges from 3 to 45
	- Incremental State Merging
		- No need to identify join points
		- Merging happens at every assignment
			- You **never** maintain separate execution paths, just one big list of value summaries
	- No auxiliary variables
		- Auxiliary variables can cause non-linearity things
- Implementation
	- **Binary decision diagrams** (BDDs) are used to compactly represent guards
	- Value summaries are **compacted**
		- We can combine values in a value summary when the values are the same, but the guards differ
			- $pc \mapsto \{ (PC_6, 10), (\neg PC_6, 10) \} = \{ (true, 10) \}$
		- Don't need to consider $(false, v)$

# Introduction to Program Verification ==9/6== ==9/11==

- Lots of analyses of programs
- Analyses are on axes of power and automated-ness
	- Type-checking is automated but not as powerful
	- Data-flow analysis is 
	- Dataflow analysis—where is variable used? Is code live?—is a little more manual, but a little more powerful
	- Model checking is further along: way more manual, way more powerful
	- Program verification is the most manual & powerful
- Program Verification
	- Can reason about all properties of programs
	- Not automatable - requires solving the halting problems lmao
	- Teaches how to reason about programs in systematic way
		- The "science of programming"
- Before checking a program, must specify what it does
	- Need **formal specifications** and **logic notation**
- State predicates
	- We make a bunch of predicates on the program state
- Pre and Post Conditions
	- @ Using **Hoare triples**: $\{ P \}\ S\ \{ Q \}$ ^9a4f4c
		- Program $S$ with pre-condition $P$ and post-condition $Q$
		- If initial state satisfies $P$, after executing $S$ to termination, final state satisfies $Q$
		- This is a *partial correctness assertion*: we have to assume $P$ holds *and* $S$ terminates
	- Total correctness: $[P]\ S\ [Q]$
		- If $P$ holds in some state $\sigma$
		- then there exists a new state $\sigma'$ such that $(S, \sigma) \Downarrow \sigma'$
		- and $Q$ holds in $\sigma'$
		- This means if $P$ holds, we *know* the program will terminate!
		- We don't *assume* termination, we *assert* it.
- Derivation rules (**sequent logic!**) for Hoare logic ^8a9qz6
	- We write $\vdash \{A\}\ c\ \{B\}$ when we can derive the triple with derivation rules
	- We can add a new rule for each syntactic construct:
		- For `skip`, which is a no-op, the precondition and postcondition are the same. $$\begin{prooftree} \AXC{} \UIC{$\vdash \{ A \}\ skip\ \{A\}$} \end{prooftree}$$
			- But this doesn't handle broader things: $\vdash \{ x \geq 2 \}\ skip\ \{ x \geq 0 \}$
			- @ **Consequence rule**: $$\begin{prooftree} \AXC{$\vdash P_1 \implies P_2$} \AXC{$\vdash \{P_2\}\ S\ \{Q_2\}$} \AXC{$\vdash Q_2 \implies Q_1$} \TIC{$\vdash \{P_1\}\ S\ \{Q_1\}$} \end{prooftree}$$
			- Essentially, lets us strengthen precondition and weaken postcondition.
		- Assignment is simple op, but complicated!
			- $$\begin{prooftree} \AXC{} \UIC{$\vdash \{ [e/x] A \}\ x := e\ \{ A \}$} \end{prooftree}$$
			- Post-condition is $A$, pre-condition is $A$ with expression $e$ replacing variable $x$ in $A$
			- Watch out for more constructs, e.g. languages with aliasing
			- % We can also write this rule a different way, in the forward direction: $$\begin{prooftree}\AXC{} \UIC{$\vdash \{ A \}\ x := e\ \left\{  \exists x_{0}.\left[x_{0}/x] A \cap x = e[x_{0}/x] \right]  \right\}$}\end{prooftree}$$
				- % $x_0$ is the prior symbolic value of $x$
		- Semicolon: $$\begin{prooftree} \AXC{$\vdash \{A\}\ c_1\ \{B\}$} \AXC{$\vdash \{B\}\ c_2\ \{C\}$} \BIC{$\vdash \{A\}\ c_1; c_2\ \{C\}$} \end{prooftree}$$
		- Conditionals: $$\begin{prooftree} \AXC{$\vdash \{ A \cap B \}\ c_{1}\ \{ C \}$} \AXC{$\vdash \{ A \cap \neg B \}\ c_{2}\ \{ C \}$} \BIC{$\vdash \{ A \}\ \verb|if B then c1 else c2|\ \{ C \}$} \end{prooftree}$$
		- While: $$\begin{prooftree}\AXC{$\vdash \{ I \cap E \}\ c\ \{ I \} $} \UIC{$\vdash \{ I \}\ \verb|while (E) c|\ \{ I \cap \neg E \}$}\end{prooftree}$$
			- @ $I$ is the **loop invariant**. We can't compute; programmer has to provide :,)
			- If we want to show something more general ($\vdash \{ P \}\ \verb|while (E) S|\ \{ Q \}$), we can get from this specific form to more general form with *consequence rule*
				- Initial $P \implies I$: the pre-condition implies the loop invariant.
				- **Preservation** of invariant $\vdash \{ I \cap E \}\ c\ \{ I \}$: the loop invariant is preserved on each iteration
				- Final $I \implies (\neg E \implies Q)$: Given the invariant (always) holds, if the while condition no longer holds (i.e. we want to break out of the loop), the post-condition must hold
- Applying Hoare rules
	- They're *mostly* syntax directed
	- & Wrinkles to keep in mind
		- When to apply the rule of consequence
		- What invariant to use for while
		- How to prove implications involved in consequence
	- **Theorem provers** can help you with the last part
		- Proof assistants e.g. Lean 4, Coq, Agda, Idris, ...
		- Loop invariants are hard tho lmao

## Weakest Precondition

- Background: **assertions** $\sigma \models A$ ^85dbe6
	- Given state $\sigma$ (mapping of free vars to vals in $A$), predicate $A$ is true
	- Difference between $\vdash$ and $\models$
		- Single line $\vdash$ is derivation
			- If you can derive the fact from other rules
		- Double line $\models$ is assertion, tautology
- @ Proving things with **weakest preconditions**
	- What if we want to prove that $\models \{ A \}\ c\ \{ B \}$?
		- We can find all predicates $A'$ such that $\models \{ A' \}\ c\ \{ B \}$. This set is $Pre(c, B)$.
		- Then, if we can prove that $A \in Pre(c, B)$, we know the original assertion is true!
	- We can order assertions by strength, based on what assertion implies another.
		- Stronger assertions imply weaker ones.
		- e.g. $x \geq 10 \implies x \geq 0$
		- In general, the strongest, most exclusive assertions imply the weakest, most inclusive/universal assertions.
			- $false \implies true$
	- @ The **weakest precondition** $WP(c, B)$ is the predicate such that $\forall P \in Pre(c, B). P \implies WP(c, B)$
		- The weakest assertion/precondition for the program $c$ such that $B$ still holds after execution
- Inductive definition (kinda)
	- We can make an algorithm for computing the weakest precondition by following our Hoare rules!
	- Semicolon: $$wp(c_{1}; c_{2}, B) = wp(c_{1}, wp(c_{2}, B))$$
	- Assignment: $$wp(x := e, B) = [e / x]B$$
	- Conditional: $$wp(\verb|if E then c1 else c2|, B) = (E \implies wp(c_{1}, B)) \cap (\neg E \implies wp(c_{2}, B))$$
	- Loops: complicated lmao
		- `while b do c` is the same as `if b then (c; while b do c) else skip`
		- Let $w =$ `while b do c` and $W = wp(w, B)$
		- From conditional rule, we have: $$W = (b \implies wp(c, W)) \cap (\neg b \implies B)$$
		- This is recursive oh fuck lmao
		- ==TODO==
- **WP are impossible to compute (in general)**
	- WPs for (while) loops suck
	- We don't necessarily need the **weakest** precondition
	- We're okay with a weak precondition, even if it's not necessarily *the weakest*, as long as:
		- it's **algorithmically computable** and
		- **weaker than the predicate $A$** that we're tryna prove is in $Pre(c, B)$
- @ **Verification Conditions** ^wyyakc
	- We construct a **verification condition** $VC(c, B)$ such that it's easy to compute and weaker than $A$: $A \implies VC(c, B) \implies WP(c, B)$
	- How? Factor out the hard work lmao
		- @ Make user provide loop invariants
		- @ Also make user provide function specs: a pre- and post-condition
	- Let's make a new "while-with-invariant" loop: `while {I} b do c`
		- $I$ must hold **before every execution of loop body $b$**
	- $VC$ is the same as $WP$ for non-loops
	- Loops: $$VC(\verb|while {I} e do c|, B) = I \cap (\forall x_{1}\dots x_{i}. I \implies (e \implies VC(c, I) \cap (\neg e \implies B)))$$
		- $I$: loop invariant holds on entry
		- $I \implies (e \implies VC(c, I))$: $I$ holds in an arbitrary iteration
		- $I => (\neg e \implies B)$: $B$ holds when loop terminates in arbitrary iteration
		- What's going on with the $\forall x_{1}\dots x_{i}$?
			- Our loop body $e$ could have free variables that we're modifying!
			- `while {I} x > 0 do x -= 1; y -= 2`
			- Our verification condition has to be preserved **in an arbitrary iteration**
				- Additionally, $B$ has to hold when the loop terminates **in an arbitrary iteration**
			- Thus, we need to be able to make sure that this verification condition holds for **every possible value of the variables we're modifying!!**
			- In this case, that means, $\forall x, y.$ $I$ implies that
				- if the condition is true at some point, executing the body will yield a verification condition on our state that **implies the loop invariant** and
				- if the condition is false at any point, $B$ (postcond) will hold.
- @ **Forward VC Generation via Symbolic Evaluation**
	- How do we avoid exponential blowup of our $VC$?
	- General intuition: go forwards (iterative def) instead of backwards (inductive def)!
		- Keep track of symbolic state mapping vars to expressions
		- Consider program $x_{1} := e_{1}; x_{2} := e_{2}$
		- Normally, calculating $VC(c, B)$ would result in nested substitutions
			- $VC(c, B) = [e_{1} / x_{1}, [e_{1} / x_{1}]e_{2} / x_{2}]B$
			- This means we sort of go backwards
		- Instead, keep a symbolic state as we go through this program. Forwards!
		- Initially, $\Sigma_{0} = \{  \}$
		- After first expr, $\Sigma_{1} = \{ x_{1} \mapsto e_{1} \}$
		- After second expr, $\Sigma_{2} = \{ x_{1} \mapsto e_{1}, x_{2} \mapsto [e_{1} / x_{1}]e_{2} \}$
			- $[e_{1} / x_{1}]e_{2}$ will become some concrete symbolic val $c$, and the mapping will be flat again!
			- $\Sigma_{2} = \{ x_{1} \mapsto e_{1}, x_{2} \mapsto c \}$
		- Basically, at each assignment, we apply the current subst state $\Sigma_{i}$ as a substitution for the expr we're assigning
	- Consider language of instructions: $$x := e \mid f() \mid \verb|if e goto L| \mid \verb|goto L| \mid L:\; \mid return \mid inv(e)$$
		- $L$ is a program location, a label for gotos
		- $inv(e)$ means **inv**ariant: $e$ must hold at that point
		- Note: no explicit loops, just `goto`s
	- Create symbolic evaluation state $$\Sigma: Var \to SymbolicExprs$$
		- $\Sigma(x)$ is symbolic value of $x$ in $\Sigma$
		- $\Sigma[x := e]$ is a new state where $x$'s value is $e$
		- $\Sigma(e)$ is the expression $e$ such that all vars $x_{i}$ are replaced with $\Sigma(x_{i})$
	- Symbolic evaluator also **keeps track of encountered invariants**
		- We have new evaluation state: $Inv \subseteq \mathbb{N}$. $Inv$ is the set of every instruction # that's an invariant that we've encountered so far
		- We execute an $inv$ instruction twice:
			- The first time it's encountered
			- And one more time around an *arbitrary* iteration
	- @ We define $VC$ as an **interpreter**.
		- $VC$ takes as input a state: the program counter, symbolic state, and invariant state.
		- `goto` doesn't change any of our state. $$VC(k, \Sigma, Inv) = VC(L, \Sigma, Inv)\text{ if } I_{k} = \text{goto } L$$
		- In a conditional, the true case implies the $VC$ returned by the label we go to. The false case implies the $VC$ at the next instruction. $$VC(k, \Sigma, Inv) = \Sigma(e) \implies VC(L, \Sigma, Inv) \cap \neg \Sigma(e) \implies VC(k + 1, \Sigma, Inv)$$
			- where $I_k = \verb|if e goto L|$
		- At an assignment, we move to the next instruction and modify our state. $$VC(k, \Sigma, Inv) = VC(k + 1, \Sigma[x := \Sigma(e)], Inv)\text{ if } I_{k} = x := e$$
		- If we return from a function, the $VC$ is just the annotated post-condition of the function. $$VC(k, \Sigma, Inv) = \Sigma(Post_{f})\text{ if } I_{k} = \text{return}$$
		- If we're calling into a function, a few things have to be true.
			- One, the annotated precondition of the function has to hold
			- Two, with our annotated postcondition, replace every occurrence of a variable the function modifies $y_m$ with a fresh symbolic variable $a_m$.
				- This is basically the $\forall y_{m}$ from the while loop above. We just need to explicitly assign $y_m$ a symbolic value so it works with a constraint solver
				- This new postcondition implies the $VC$ at the next instruction.
			- $$VC(k, \Sigma, Inv) = \Sigma(Pre_{f}) \cap \forall a_{1} \dots a_{m}. \Sigma'(Post_{f}) \implies VC(k + 1, \Sigma', Inv)$$
				- where $\Sigma' = \Sigma[y_{1} := a_{1}, \dots, y_{m} := a_{m}]$
		- For an invariant instruction:
			- If we haven't seen the invariant before, we find all the variables that could be modified on a path from the invariant back to itself.
				- Compute w static analysis
				- Use this set of variables like in a function call - instead of precondition, we just have the invariant expression straight-up
					- The precondition is like an invariant!
			- If we have, straight-up return the invariant expression $\Sigma(e)$, like a function return
		- Then we put all this together!
			- Give every variable a fresh symbolic value in your state
			- For every function $f$, compute $\forall a_{1} \dots a_{n}. \Sigma_{0}(Pre_{f}) \implies VC(f_{entry}, \Sigma_{0}, \{  \})$
			- If all these predicates hold true, then
				- At all $inv(e)$, $e$ holds and
				- If a function returns, $Post_f$ holds

#  Fuzzing ==9/13== ==9/18==

- Fuzzer generates random input
	- Start with random inputs.
	- **Mutational fuzzing**: start with interesting well-formed inputs, then mutate inputs iteratively
	- **Feedback-directed fuzzing**: keep track of branch coverage.
		- Save new inputs that are interesting: go through new branches, longer execution, etc.
		- This is AFL

## Generator-Based Fuzzing (Quickcheck, etc.)

- Property-based testing!
	- Identify type of inputs, for each type of input, have algorithm to generate inputs of that type
- Why type-based generators?
	- Always produces syntatically valid inputs
	- Generators easy to write (can potentially be automatically synthesized)
	- Goes deeper
- Generators have no feedback tho
	- Generators take randomness as input. Basically a list of bits. Called parameters.
	- Parametric generator: explicitly pass in stream of bit params, instead of just random bit generator
	- ["] The key insight in Zest is that bit-level mutations on these parameters correspond to structural mutations in the space of syntactically valid inputs.
	- We can modify this bit list to do structural modification for new inputs
	- Slot this generator into feedback-guided fuzzing infrastructure.
