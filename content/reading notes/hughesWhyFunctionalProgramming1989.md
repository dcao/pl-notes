---
aliases:
  - "Why Functional Programming Matters"
tags:
  - reading
year: 1989
authors:
  - Hughes, J.    
status: Todo
source: https://academic.oup.com/comjnl/article-lookup/doi/10.1093/comjnl/32.2.98 
related:  
itemType: journalArticle  
journal: "The Computer Journal"  
volume: 32  
issue: 2   
pages: 98-107  
DOI: 10.1093/comjnl/32.2.98
scheduled: 2024-08-05
---
# Introduction

In **functional programming**, the fundamental operation is function application. A main program is a function that receives program's input and delivers program's output as result. It's written in terms of other functions, all the way down to language primitives at the bottom. Written like math functions. Haskell!

Normally, when we proselytize for FP, we argue that there are **no side-effects**. No side-effects means fewer bugs, no order-of-execution requirement, no need to prescribe control flow. This also gives us **referential transparency**: variables can be freely replaced by their values.

But this is mostly what is *lacking* in FP, and doesn't really provide a positive argument *for* FP. How do we construct a *positive argument for FP*, both to provide more compelling arguments for it, but to also guide FP programmers as to what constitutes "good FP programming?"

# An analogy with structured programming

Structured programs used to be described as "no goto statements," but really the value is in encouraging modular design (i.e., organizing code into reusable, independently testable functions). Modular design involves breaking down a problem into subproblems, solving those subproblems, and gluing together the solutions.

Our argument for functional programming: **it provides new tools for better ways to combine solutions to different subproblems in our programs**.

# Gluing functions together

With **higher-order functions**, we can modularize the idea of a "folding operation"—separate out the folding bit into `foldr`, and just specialize it for different cases: `product`, `anytrue`, `alltrue`, `append = foldr . Cons . flip`. `length`.

We can do the same for trees.

In non-FP languages, these functions are indivisible. Here, we can break it up as a combination of parts—a general higher-order function and some specializing functions.

# Gluing programs together

**Lazy evaluation** allows for other kinds of modularization. If you want to generate a range `1..n`, we can now modularize this into a generator for `1..`, and a selector `take n`. Since functional languages use lazy evaluation for everything, the programmer has full access to this modularization capability!

This can *only* exist in a world without side effects! In an imperative language, since the programmer has direct control of control flow, program order, and can do side effects like mutation, lazy evaluation would hurt modularity. In functional programming, lazy evaluation actually enhances it!

For instance, we can calculate the fixpoint of a function within some tolerance, separating generation and selection:

```haskell
consfix f a = a : consfix f (f a)
select eps (a:b:xs) | abs (a / b - 1) <= eps = b
select eps (a:b:xs)                          = select eps (b:xs)
```

The text describes implementing efficient approximation of differentiation and integration with the above foundation.

Additionally, we can separate e.g., building a move tree for a board game, and then pruning that move tree. We don't need to combine those into one procedure; they can be separate functions! `prune 5 . movetree` type shit.

The paper believes very strongly in lazy evaluation:

> This paper provides further evidence that lazy evaluation is too important to be relegated to secondclass citizenship. It is perhaps the most powerful glue functional programmers possess. One should not obstruct access to such a vital tool