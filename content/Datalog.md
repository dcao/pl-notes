# Datalog

> [!note] See also
> This takes mostly from [Max's 294 course notes on Datalog](https://inst.eecs.berkeley.edu/~cs294-260/sp24/2024-02-05-datalog)!

A Datalog program is a **database** of *facts*, along with **rules** to derive new facts. For more, see [[zhangBetterTogetherUnifying2023a#Starting with Datalog|notes about Datalog in my egglog intro notes]]. I'll reproduce the example code from those notes here, since that's kind of the canonical Datalog example:

![[zhangBetterTogetherUnifying2023a#^37ffb5|egglog]]

## Naïve evaluation

In a naïve Datalog evaluator, we evaluate our programs **bottom-up**, starting with the facts that have been explicitly stated for us, and then iteratively applying our rules in successive time steps to discover new facts, until we reach a **fixed point**, where applying our rules yields no new facts.

Let's walk through the example above to show this! We can build a table showing when different facts are learned at different time steps. In the initial time step, we only have the facts that have been explicitly stated:

| time | `e`dge | `p`ath |
| ---- | ------ | ------ |
| 0    | (1, 2) |        |
|      | (2, 3) |        |
|      | (3, 4) |        |

At this point, the program begins to derive new facts. The first "base case" rule kicks in, allowing us to insert everything in `e` into `p`:

| time | `e`dge | `p`ath |
| ---- | ------ | ------ |
| 0    | (1, 2) |        |
|      | (2, 3) |        |
|      | (3, 4) |        |
| 1    |        | (1, 2) |
|      |        | (2, 3) |
|      |        | (3, 4) |

Now, let's apply the inductive rule, `p(x, z) :- e(x, y), p(y, z)`. Note that this is a **conjunctive query**, in other words, it's a **join** on `y` between the two tables `e` and `p`!

| time | `e`dge | `p`ath |
| ---- | ------ | ------ |
| 0    | (1, 2) |        |
|      | (2, 3) |        |
|      | (3, 4) |        |
| 1    |        | (1, 2) |
|      |        | (2, 3) |
|      |        | (3, 4) |
| 2    |        | (1, 3) |
|      |        | (2, 4) |

Finally, we run the rule again:

| time | `e`dge | `p`ath |
| ---- | ------ | ------ |
| 0    | (1, 2) |        |
|      | (2, 3) |        |
|      | (3, 4) |        |
| 1    |        | (1, 2) |
|      |        | (2, 3) |
|      |        | (3, 4) |
| 2    |        | (1, 3) |
|      |        | (2, 4) |
| 3    |        | (1, 4) |

At this point, execution has reached *fixed point*, since applying the rules doesn't add any new facts.

## Optimizations

### Semi-naïve evaluation

In general, a join can only produce new tuples if one of the relations in the join changes. For two relations $R$ and $S$, let $RS$ be their join. $\Delta R$ and $\Delta S$ are the new tuples added to $R$ and $S$, respectively. We can show:

$$ \begin{aligned}
RS + \Delta(RS) &= (R + \Delta R)(S + \Delta S) \\
RS + \Delta(RS) &= RS + R \Delta S + S \Delta R + \Delta R \Delta S \\
\Delta(RS) &= R \Delta S + S \Delta R + \Delta R \Delta S
\end{aligned} $$

In other words, we don't need to recompute the join between old $R$ and old $S$! To compute the new tuples of a join, only need to join old-new, new-old, and new-new! Under the hood, Datalog engines support this by explicitly maintaining the new and old parts of each relation, and then rewriting rules as joins over new/old parts.

### Magic sets

As we described above, in naïve execution, we execute totally bottom-up. Thus, our program above would calculate *all* possible paths in the graph.

But what if we only care about a specific path between, e.g., vertices 42 and 56? Since we don't care about all the paths anymore, we can manually write a Datalog program that limits our attention to only paths that start from 42:

```datalog
path_from_42(42, X) :- edge(42, X).
path_from_42(X, Z) :- path_from_42(X, Y), edge(Y, Z)
```

The **magic set transformation** automatically generates such a program from the more general one, given a *goal query* to compute, e.g., `path(42, X)`. Magic sets gives us top-down-flavored bottom-up!

## Extensions

### Negation

From [Philip Zucker's online book on Datalog](https://www.philipzucker.com/datalog-book/negation.html), another slayful Datalog resource:

> A fact not existing in the database doesn't necessarily mean it won't eventually be derived. This simple fact makes negation tricky.

In particular, in standard Datalog, **we never forget facts**. So how could we compute a rule like this, where we want to find all pairs that are *not* connected in a graph:

```datalog
disconnected(X, Y) :- not path(X, Y).
```

Well, intuitively, we can just compute `path` to fixpoint first, then compute `disconnected` using that. This is called **stratified negation**. Basically, we separate the computation of `path` and `disconnected` into separate **strata**. We're basically dividing our Datalog program into little sub-programs! The former strata is computed first, then the latter. The specific rules are:

- All rules that share a head relation are in the same stratum.
 - The stratum containing rules with `R` in the head *defines* `R`.
- A rule `... :- S(..), ...` must be in *the same or higher* stratum as the one that defines `S`.
- A rule `... :- not S(..), ...` must be in a *strictly higher* stratum that the one that defines `S`.

### Lattices, semi-rings, fun stuff

**egglog** is an extension of Datalog that combines it with equality saturation, à la `egg`. See [[zhangBetterTogetherUnifying2023a|Better Together: Unifying Datalog and Equality Saturation]]. egglog augments Datalog with lattices and equality saturation (i.e., an equality relation).

**Souffle**, another Datalog extension language, implements this with something called **[subsumption](https://www.philipzucker.com/datalog-book/lattices.html)**: the ability to conditionally delete rules:

```souffle
mymax(z) :- reltomax(z).
mymax(z) <= mymax(z2) :- z1 <= z2.
```

The lecture notes talk about this in terms of **semi-rings**: sets with an additive and multiplicative identity value, and additive and multiplicative operations.

A relation `R` in datalog is basically a function that returns true or false: $$ \begin{aligned}
f_{R}(x, y, z) &= true &&\text{ when } (x, y, z) \in R \\
&= false &&\text{ otherwise}
\end{aligned} $$
But what if we change the output type from boolean to something else? What if we could output numbers? Other stuff? And if we do that, do we still get the nice properties of Datalog (e.g., semi-naïve evaluation, which relies on some algebraic rearrangement)?

There are two kinds of operations on the output of these functions:

- **Joint use** ($\times$): what happens if we use multiple outputs at once? e.g., `p(x, y) :- e(x, y), p(y, z).`
- **Alternative use** ($+$): what happens if we derive a value multiple times?

Here, instead of talking in terms of lattices, we're talking in terms of **semi-rings**, and we consider these functions as having semi-ring outputs. Normally, in Datalog, we have boolean semi-rings. To get back min-path, we could consider $\operatorname{min}$ as alternative use and $+$ as joint use. This parallels the "min-int lattice" presentation shown above.

### Existentials, ADTs, EGDs, TGDs

Can we model this in Datalog?
$$
\forall x. person(x) \implies \exists y. parent(x, y)
$$
No. What would it mean to put an existential in the head of our rule?

There's an algorithm called **[the chase](https://en.wikipedia.org/wiki/Chase_(algorithm))** from database theory that's a kind of generalization of Datalog. It has two kinds of "rules" which it calls dependencies:

- **Tuple generating dependencies** (TGDs) are Datalog rules. They have a body and head and are used to derive new tuples. TGDs let us do existential quantification in the head.
- **Equality generating dependencies** (EGDs) enforce constraints that certain values are equal.

Doesn't terminate in general, since existential quantification in head allows new values to be introduced at each step.

A restricted form of TGDs are ADTs! Both Souffle and egglog have ADTs. See [here](https://www.philipzucker.com/datalog-book/adt.html#egglog) for comparison of the differences:

1. Souffle's datatypes are closed—you can't add new constructors. egglog's are open—datatypes are basically jsut functions.
2. Datatypes in egglog are searchable. Souffle requires you to manually reflect into indexing tables.
3. egglog's `Id`s aren't stable over time, since they change as eqsat occurs.
