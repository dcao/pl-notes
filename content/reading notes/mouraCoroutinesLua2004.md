---
aliases:
  - "Coroutines in Lua"
tags:
  - reading
year: 2004
authors:
  - Moura, Ana De
  - Rodriguez, Noemi
  - Ierusalimschy, Roberto    
status: Todo
source: https://lib.jucs.org/article/28267/ 
related:  
itemType: journalArticle  
journal: "JUCS - Journal of Universal Computer Science"  
volume: 10  
issue: 7   
pages: 910-925  
DOI: 10.3217/jucs-010-07-0910
scheduled: 2024-08-10
---
# What the hell is a continuation

**Coroutines** are a kind of async/await-style execution delegation. Coroutines have two properties:

1. Values of data local to a coroutine persist between successive calls
2. The execution of a coroutine is suspended as control leaves it, only to carry on where it left off when control re-enters the coroutine at some later stage.

It's useful for concurrent programming, simulation, text processing, AI (??), and other data structure manipulation.

# Lua coroutines

Lua is designed to be integrated with C code—it's originally an extension language, meant to be embedded in another program. It implements **asymmetric coroutines**, which have two control transfer operations: (re)invoking a coroutine, and suspending it and returning control to the caller. Here, the coroutine is subordinate to the function that calls it.

There are also *symmetric coroutines*, where we only have a single transfer function for passing control to other coroutines. These are equivalently expressive. However, they chose asymmetric for a few reasons:

- It's like threads, so people understand control flow involved
- Easier to integrate with C. Lua and C code can freely call each other. With symmetric coroutines, you'd need to implement coroutines for C, so that you could preserve C calling state when a Lua coroutine is suspended. This won't happen.

## Lua coroutine facilities

Lua gives us *first-class coroutines*. We can **create** a coroutine, which doesn't execute it, but instead sets its **continuation point** to before the body of the coroutine. A calling function can **resume** the coroutine to start its execution; we can also pass arguments to the coroutine when resuming. Within the coroutine, we can **yield**, suspending execution of the coroutine, saving its execution state, and returning control back to the calling function. Like with resumption, coroutines can yield *with a value*.

```lua
co1 = coroutine.create(function(a)
	coroutine.yield(a + 2)   -- yielding with a value
	coroutine.yield(a + 4)
	coroutine.yield(a + 6)
end)

-- resume returns whether we could successfully resume, and the value.
success, value1 = coroutine.resume(co1, 2)
success, value2 = coroutine.resume(co1, 2)
success, value3 = coroutine.resume(co1, 2)

-- equivalently
co2 = coroutine.wrap(function()
	coroutine.yield(2)
	coroutine.yield(4)
	coroutine.yield(6)
end)

v1 = co2(2)
v2 = co2(2)
v3 = co2(2)
```

Coroutines maintain their own separate stacks. A coroutine terminates if its calling function returns, or if an error occurs during execution. In these cases, it's said to be *dead*.

Importantly, we can **yield within nested function calls**!

> [!note] Stackful vs. stackless coroutines
> Lua coroutines' ability to yield within function calls requires that they are *stackful*—they just maintain their entire activation stack upon suspension, so that we know what the call stack was on resumption. If you only allow a function to yield one level up, you can implement *stackless* coroutines, since you know where to resume from (one level up).
> 
> See https://blog.varunramesh.net/posts/stackless-vs-stackful-coroutines/ for more info.

## The operational semantics

> [!note] Evaluation contexts
> The paper uses a style of presenting operational semantics called **evaluation contexts**. Evaluation contexts, written with BNF notation, represent terms with a hole $\square$, denoting where a reduction can happen. If we have an evaluation context $E$, then $E[t]$ represents the set of terms where $t$ fills the hole.
> 
> We use these terms along with small-step rules to skip having to write tons of redundant rules. For instance, if you have the following grammar for holed terms: $$ E \to \square \mid succ\ E \mid pred\ E \mid if\ E\ then\ t\ else\ t \mid iszero\ E $$
> Then this rule replaces all the congruence rules (E-Succ, E-Pred, E-IsZero): $$ \begin{prooftree} \AXC{$t \to t'$} \UIC{$E[t] \to E[t']$} \end{prooftree} $$
> 
> For more information, see https://www3.nd.edu/~dchiang/teaching/pl/2022/semantics.html and https://courses.cs.cornell.edu/cs6110/2009sp/lectures/lec08-sp09.pdf.

In our semantics, we add *labels* as a value type, used to reference coroutines. Stores now map from variables and labels to values. An evaluation context can be labeled.

`create v` returns a label to that coroutine, with the mapping store a map from that label to `v`. Resuming means re-inserting the stored continuation at the current point, and calling it with an argument. If at some point, the resumed coroutine yields again (this must occur in a labeled subcontext—the bottom coroutine), $l$ becomes a function that takes in an argument to resume. Otherwise, if we just have a regular value, return that.

![[Screenshot 2024-08-10 at 8.57.47 PM.png]]

# Programming with Lua asymmetric coroutines

## Generators

Generators, as in iterators etc.

We can use generators for solving Prolog queries and doing pattern-matching (i.e., parsing) problems. A problem or a *goal* is either a primitive goal or a a disjunction of subgoals. These subgoals are themselves conjunctions of goals. In a pattern-matching problem, string literals are primitive goals, alternative patterns are disjunctions, sequences of characters are conjunctions. Prolog unification is another example: relations are disjunctions, rules are conjunctions. Importantly, we need to backtrack to solve these kinds of goals, trying alternative solutions until we find a result.

We can implement backtracking with generators. We wrap a goal in a Lua coroutine. A backtracker successively resumes a goal until it finds an adequate results. A primitive goal yields each of its successful results. Disjunctions sequentially invoke alternative goals, conjunctions sequence successive goals.

Doing yielding in nested calls is key to making this work.

> [!note] See also
> For more information on using continuations for goal-solving in the context of e.g., Prolog, see [[carlssonImplementingPrologFunctional1984|On implementing Prolog in functional programming]].

## Multitasking

Threads are *preemptive multitasking*. The scheduler can yank control from a thread at any time, preemptively interrupting its execution to allow other threads to complete. Coroutines provide an alternate concurrency model around **cooperative multitasking.** A coroutine must explicitly yield to allow another coroutine to run!

Preemptive multitasking is important for critical low-latency tasks, but burdens programmers with ensuring sync is handled correctly (e.g., race conditions! program execution dependent on thread timing). In cooperative multitasking, we don't ned to worry about race conditions or sync!

Coroutines represent concurrent tasks. We have a set of live tasks that we iterate through and resume in turn. Note that for I/O, we need to implement separate I/O facilities that yield instead of block.

# Coroutines in other languages

Python has generators. However, we can't yield within nested function calls; you have to manually propagate this up if you want this. You also can't implement multitasking with this approach.

# With respect to continuations

Coroutines are equivalent to [[continuation-passing style#Delimited continuations|delimited continuations]], what they call *partial continuations*.