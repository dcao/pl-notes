See also: https://arxiv.org/pdf/2012.10086

# Dataflow analysis

- A **dataflow framework** (read: a dataflow problem) $(D, V, \land, F)$ consists of:
	- A **direction** $D$, forwards or backwards.
	- A **semilattice** with domain $V$ and meet operator $\land$.
		- In dataflow analysis, more precise analyses are always "bigger," since meet is the combination of two paths.
			- We're going down the lattice as we combine more paths
		- while in abstract interpretation this is the other way around (though in abstraction, this is just convention and isn't required).
	- A set of transfer functions $F : V \to V$.
		- For forward, meet on entry, transfer goes from enter to exit.
		- Meet in between statements/blocks, transfer within a block.
		- **Monotone** if preserves lattice order, **distributive** if continuous, i.e., $f(x \land y) = f(x) \land f(y)$
- Strategies for computing dataflow
	- **Ideal**: find meet between all paths from entry that actually reach $B$ in real computation
		- *Smaller* (less precise) solutions are conservative, *greater* solutions are incorrect.
		- Undecidable
	- **Meet-over-paths (MOP)**: find meet between *all paths*, even if not executed.
		- No direct algorithm: "all paths" is unbounded with cycles
	- **Maximum fixpoint (MFP)**: algorithm
		- At each node, compute meet, then transfer function. Repeat til fixed point.
		- If distributive, this is MOP. If not, this is less than MOP.
- Example analyses
	- **Liveness**: will this variable be used later before modification? Backwards
	- **Availability**: has this expression been used before as-is? Forwards
	- **Reaching definitions**: what definitions are relevant here? Forwards
	- **Constant propagation**: i.e., constant folding. *Not distributive*.
	- **Alias analysis**: do two pointers point to same object? See [[#Alias analysis]].
- Optimizations
	- **Constant folding**: const *eval*. Constant propagation is just *substitution*.
	- **Dead-code elimination**: liveness analysis.
	- **Partial-redundancy elimination**: don't repeat expression multiple times.
		- Incorporates loop-invariant code motion, eliminates redundant expressions, computes expressions as late as possible
		- Find anticipated (i.e., **very busy**) expressions (will `x + y` always be computed between here and end): backwards dataflow.
		- Find points where each expr is postponable: points where expr where anticipated but not available (i.e., before they're used). Forward analysis.
		- Eliminate single-use temp var assignment with used (liveness for expressions) analysis. Backwards.
		- Place expr definition accordingly and replace use if needed.
- Loops
	- **Dominator**: start to $b$ must go through $d$. Post-dominator is converse.
	- **Preorder**: node before children ltr. **Postorder**: children ltr, node.
	- **Depth-first ordering**: reverse postorder of CFG.
	- **Depth-first spanning tree**: visit CFG in depth-first order, add edge $a \to b$ if $b$ not seen before.
		- Dataflow algorithm will converge in depth of DFST + 2 iters.
	- Edge of a CFG $A \to B$ is:
		- **Advancing**: if $B$ descendant of $A$ in DFST
		- **Retreating**: if opposite
		- **Cross**: if neither
		- **Back edge**: $B$ dominates $A$. Always retreating.
	- CFG **reducible** if retreating edges is back edges regardless of DFST build order doesn't matter.
		- Non-reducible: ![[Screenshot 2024-07-23 at 8.30.04 PM.png]]

[[2024-07-10 • optimizations and gc]] ([[ahoDragonBookMachineindependent2007|Dragon Book 9: Machine-independent optimization]]), [[lattice]], [[inlining]]

# Abstract interpretation

- **Abstract interpretation** is any case where we have abstract semantics approximating concrete semantics for analysis purposes.
	- Dataflow analysis, control flow analysis are kinds of abstract interpretation.
- Defined by two functions:
	- **abstraction** $\alpha : L \to M$, **concretization** $\gamma : M \to L$
		- e.g., $L = \mathcal{P}(\mathbb{Z}), M = \mathbf{Interval}$
	- **Galois connection**: proving that $L$ and $M$ correspond to the same semantics
		- Prove $\gamma \circ \alpha \sqsupseteq id$ and $\alpha \circ \gamma \sqsubseteq id$
		- or prove **adjunction**: $\alpha(l) \sqsubseteq m \iff l \sqsubseteq \gamma(m)$
		- $\gamma$ and $\alpha$ must be monotone.
	- **Soundness** of Galois connection: second half of adjunction. If $l$ is concrete interpretation, $m$ is abstract: $l \sqsubseteq \gamma(m)$
		- ![[2024-07-31 • Justin, prelim targeted - abstract interpretation#^ccq950]]
- Other stuff
	- **Galois insertion**: $\gamma$ must be injective: one element of $M$ per $L$. $\alpha \circ \gamma = id$
	- Composing Galois connections
		- **Sequential composition**
		- Products (regular, relational: $(\mathcal{P}(V_{1}), \mathcal{P}(D_{1})) \to (\mathcal{P}(V_{1} \times V_{2}), \mathcal{P}(D_{1} \times D_{2})$)
		- **Monotone functions** $(L_{1}, M_{1}), (L_{2}, M_{2}) \to (L_{1} \to L_{2}, M_{1} \to M_{2})$
		- Direct product: abstraction is element-wise, concretization is join of items
		- Direct tensor product: is to direct product what relational is to independent items. Requires two $\eta_{1}, \eta_{2}$, similar construction to relational.
- Hierarchy of semantics. Trace semantics at very bottom (most precise), axiomatic semantics at top.
- Fixed points
	- **Widening** to get to an over-approximate fixpoint...
		- Define operation $\nabla$ such that $a \lor b \sqsubseteq a \nabla b$
		- Given a chain $d_{0} \sqsubseteq d_{1} \sqsubseteq \cdots$, the chain $d_{0}^\nabla \sqsubseteq d_{1}^\nabla \sqsubseteq \cdots$ eventually stabilizes.
			- $d_{0}^\nabla = d_{0}$
			- $d_{i + 1}^\nabla = d_{i}^\nabla \nabla d_{i + 1}$
	- ...then **narrowing** to get closer to least fixpoint.
		- $x \sqsubseteq y \implies x \sqsubseteq (x \Delta y) \sqsubseteq y$
			- $\Delta$ gives us something less than $y$, but not less than $x$.
		- For decreasing chains $x_{0} \sqsupseteq x_{1} \sqsupseteq \cdots$, the chain $(x_{n}^\Delta)_{n}$ eventually stabilizes

See [[2024-08-07 • control flow analysis & abstract interpretation]] ([[nielsonPrinciplesProgramAnalysis1999b|Principles of Program Analysis 4: Abstract interpretation]]), [[lattice]], [[2024-07-31 • Justin, prelim targeted - abstract interpretation]]

# Control flow analysis

- **Control flow analysis** asks: *what functions could this expr evaluate into?*
	- A kind of abstract interpretation that works well for functional programs with no program points, nested computation, and first-class functions
	- Dispatch is dynamic. How do we know where control flow goes?
- Analysis maps from variable or labeled subexpression to lattice: $\sigma : Var \cup Lab \to L$
	- We can divide this into execution environment $\hat{C} : Lab \to L$ and abstract environment $\hat{\rho} : Var \to L$
	- In CFA case, $L = \mathcal{P}(\lambda x. e)$, $\sqsubseteq \stackrel{\text{def}}{=} \subseteq$
- **Acceptability** relation: $(\hat{C}, \hat{\rho}) \models e$ iff $(\hat{C}, \hat{\rho})$ is an acceptable CFA for $e$.
	- The relation *generates constraints*.
		- $(\hat{C}, \hat{\rho}) \models (\lambda x. t)^l \iff \{ (\lambda x. t)^l \} \subseteq \hat{C}(l)$
		- For application, **arg flows to parameter, body flows to application.** Into function through arg, out through body.
	- Can be solved in $O(n^3)$ with graph approach, with edges between $\subseteq$ constraints
		- Syntax-directed constraint gen.
		- Generate $a \subseteq b$ and $a \subseteq b \implies c \subseteq d$ constraints, meaning if $a \subseteq b$, $c \to d$ and $b \to d$
		- Can also be solved in $O(n^5)$ with fixed-point calculation.
- Adding **dataflow** information
	- We add dataflow info alongside our CFA info, mapping from $Lab$/$Var$ to dataflow lattice $D$.
	- $(\hat{C}, \hat{D}, \hat{\rho}, \hat{\delta}) \models_{D} e$. Constraints mirror regular CFA constraints, but with $\sqsubseteq$.
- Adding **context**
	- Different call sites aren't distinguished from each other.
	- Since bodies flow to applications, all applications inherit analysis of all other applications, since they're tied to the same body.
	- e.g., `let f = (λx -> x) in (f f) (λy -> y)`
	- **$k$-CFA**
		- $\delta : \Delta$ is context of last $k$ function calls.
		- $\hat{\rho} : (Var \times \Delta) \to L$
		- $L = \mathcal{P}(Term \times (Var \to \Delta))$
			- $Var \to \Delta$ is a **context environment**, recording context where each var was bound. (i.e., when we analyze lambda introduction)
		- $(\hat{C}, \hat{\rho}) \models^{ce}_{\delta} e$
			- $ce$ and $\delta$ are a kind of *state*, changed during analysis
		- Exponential space; 0-CFA is polynomial.
	- $m$-CFA
		- Polynomial time by not allowing captures. All variables bound in same context, so context env is just $\Delta$.
	- **Cartesian Product Algorithm**
		- In a language with multiple args, apply them all at once.
		- Kind of getting $m$-CFA benefits!

## Types of analyses

- Flow sensitivity: do we take order of execution and control flow into account while executing analysis?
	- "if we have an application $(e_{1}^{l_{1}}\ e_{2}^{l_{2}})$, even if our analysis of $l_{1}$ is empty (i.e., it can't take on any lambda values), we still perform analysis of $l_{2}$ anyways."
- Path sensitivity: when encountering conditionals, does each branch's analysis incorporate conditional?
- Context sensitivity: do we treat function calls differently based on where function is called?

See [[nielsonPrinciplesProgramAnalysis1999a|Principles of Program Analysis 3: Constraint-based analysis]].

# Alias analysis

- **Points-to analysis**: keep track of all heap locations each variable could refer to at each program point. **May-alias** analysis
	- Forward dataflow with domain $\mathcal{P}(Var \to \mathcal{P}(Loc))$, union meet.
	- Can also use constraint-based repr: $\{ o_{i} \} \subseteq pt(x)$
		- We can add context to this analysis: domain is now $\mathcal{P}(Var \to \mathcal{P}(Loc, C))$, where $C$ is the call-stack (think $m$-CFAs) at the point of allocation.
		- **Object sensitivity**: context is `self`
		- **Cartesian Product Algorithm**: context is `self` and all arguments. Used for type inference, but slow
		- Can use **unification** (union-find) to solve. Equality solving.
	- Sucks for big libraries, reflection.
	- **Binary decision diagrams**: exist, can be used for equivalence checking/SAT solving
- **Access-path tracking**: Abstract interpreter that keeps track of *tuples* of info. **must-alias**
	- *Weak update* = maintains old state as part of updated state. *Strong update* = decisively choose state
	- First, do points-to. Each abstract memory location is an *instance key*.
	- An access path consists of all of `x.y. ... .z`.
	- Statements transform *abstract tuples*: instance key, allocation site has single concrete live object, access paths that **must** point to instance key, are there other access paths that could point to key, access paths that **don't** point to instance key.
	- Good for underapproximate analyses. "This *must* be an issue, and there might be more"

See [[2024-08-07 • control flow analysis & abstract interpretation]] ([[sridharanAliasAnalysisObjectOriented2013|Alias Analysis for Object-Oriented Programs]])

# Interprocedural analysis

- Build a call graph. But no context sensitivity means dataflow info from diff call sites is confused.
- Inlining into CFG works, but suffers from exponential space blowup, can't do recursion.
- Context-sensitive analyses! See [[#Control flow analysis]].
- (Context-free language) graph reachability a good fit in this context.

See [[interprocedural analysis]], [[repsProgramAnalysisGraph1998|Program analysis via graph reachability]].