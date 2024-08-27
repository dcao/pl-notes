---
aliases:
  - "The essence of compiling with continuations"
tags:
  - reading
year: 1993
authors:
  - Flanagan, Cormac
  - Sabry, Amr
  - Duba, Bruce F.
  - Felleisen, Matthias    
status: Todo
source: https://dl.acm.org/doi/10.1145/155090.155113 
related:  
itemType: conferencePaper  
location: New York, NY, USA   
pages: 237–247  
DOI: 10.1145/155090.155113  
ISBN: 978-0-89791-598-4
scheduled: 2024-07-25
---
This paper outlines the arguments for compiling using CPS, then presents an *equivalent alternative*—**administrative normal form** (**A-normal form**, or **ANF**)—that achieves the benefits of CPS with a single source-level transformation, rather than requiring multiple passes, as CPS often does.

> [!note] See also
> Even though these are paper notes, we additionally draw from the following resources:
> 
> - The abstract of [*The logical essence of compiling with continuations*](https://arxiv.org/abs/2304.14752)
> - The [Wikipedia article on A-normal form](https://en.wikipedia.org/wiki/A-normal_form)
> 
> It's recommended that you read the [[continuation-passing style]] notes first, since this provides an intro to CPS based on another resource.

# Compiling with continuations

Lots of functional languages use [[continuation-passing style|continuation-passing style (CPS)]] as their intermediate language for a number of reasons:

1. CPS form is easier to perform optimizations on.
2. CPS terms form a kind of stylized assembly language, from which it's easy to generate actual machine code.

However, this process often requires multiple phases or passes over the original source code. For instance, let's say we have the following expression, written in Lisp syntax:

![[Screenshot 2024-07-25 at 11.14.22 PM.png]]

A naïve compiler might transform this expression into the following CPS expression:

![[Screenshot 2024-07-25 at 11.14.35 PM.png]]

In this syntax, the operation `(+' k a b)` means $k(a + b)$; perform the addition `a + b`, then call the continuation `k` on the result.

However, a realistic CPS compiler would perform **beta reduction** on this expression, simplifying it in order to reduce any spurious (the paper calls them "administrative") abstractions.

![[Screenshot 2024-07-25 at 11.14.46 PM.png]]

This is still in CPS, but with many of the extra continuations removed, leaving just the bare essential continuations needed.

# A-normal form

The paper notes that in reality, realistic CPS compilers go further, eliminating further redundant information from even the above CPS form. The compiler does this by turning continuations from arguments in function calls to *contexts* surrounding these calls. In essence, this "reverses CPS," turning expressions from a bunch of calls to continuations to a bunch of let bindings to values. This information elimination is equivalent to the "reversing CPS" operation alluded to in the [[continuation-passing style|CPS notes]]:

![[Screenshot 2024-07-25 at 11.18.19 PM.png]]

This new form of the program—**administrative normal form**, or **A-normal form** or *ANF*—is defined by two key properties:

1. Functions are only called on atomic values: variables, constants, and λ-terms.
2. The result of any non-trivial expression (e.g., function application) is immediately let-bound.

§4 of the paper details A-reduction, the strategies for reducing an expression to ANF. §5 details how ANF and CPS are equivalent.

## Why compile with ANF

The authors argue that *ANF is the essence of compiling with continuations*: in other words, it captures what makes compiling with CPS so good—giving you all the benefits of CPS—without some of its extra cruft.

The paper argues that compilers that use CPS often do the un-CPS step *ad hoc*, doing a partial A-normalization (converting to ANF) on an incomplete basis. Just straight-up doing A-normalization gives you a few benefits:

- You get the same optimization benefits as with CPS
	- Lots of optimizations in CPS can be expressed as $\beta$ (function call) and $\eta$ (reducing $\lambda x. f(x) \to x$) reductions
	- e.g., the non-tail call `(W (λx. k x) a b c)` becomes the tail call `(W k a b c)` with $\eta$-reduction
	- ANF has this too! `(let (x (W a b c)) x)` becomes `(W a b c)`!
- You expose new optimization opportunities
	- Functionally, ANF propagates `let` bindings to the top and merges code segments and conditionals together
		- This is what babble does! Pushes `let` bindings up!
	- `(add1 (let x (f 5)) 0))` is `(let (x (f 5)) (add1 0))` in ANF, and we can now recognize and constant-fold `(add1 0)`!
- ANF matches machine code very closely.
	- `let x = 4 + 3; let y = x + 2; y + 1` is a very close analog to machine code/assembly!

The paper summarizes this like so:

> In summary, compilation with A-normal forms characterizes the critical aspects of the CPS transformation relevant to compilation. Moreover, it formulates these aspects in a way that direct compilers can easily use. Thus, our result should lead to improvements for both traditional compilation strategies.