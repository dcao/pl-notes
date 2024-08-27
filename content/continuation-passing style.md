---
aliases:
  - continuations
---
This note collects a number of resources on *continuations* in general, as well as *continuation-passing style (CPS)*. Note that these things aren't quite the same!

- **Continuation-passing style** is a representation of programs used by compilers for optimization purposes.
- **Continuations** as a language feature is used as a way to allow users to implement control-flow features like exceptions and coroutines in user-space. It is an *abstraction* of these control flow features.

# What is a continuation?

> [!note] See also
> https://groups.seas.harvard.edu/courses/cs152/2023sp/lectures/lec10-references.pdf

A **continuation** represents "the rest of the program." For instance, let's say we have the following program:

```haskell
if foo < 10 then 32 + 5 else 7 + bar
```

When we finish evaluating the expression `foo < 10`, we'll use the result to switch on the conditional and evaluate either `32 + 5` or `7 + bar`. We say that the *continuation* of `foo < 10` is the rest of the computation that occurs after we evaluate this subexpression. In this case, the *continuation* is the computation that does the branching based on this expression, and computes the relevant math expression:

```haskell
k = \cond. if cond then 32 + 5 else 7 + bar
```

and we can thus rewrite the expression as an application of the continuation to our expression:

```haskell
let k y = if y then 32 + 5 else 7 + bar
in
	k (foo < 10)
```

One main benefit of this is making control flow explicit, by making continuations explicit!

# Continuation-passing style as a compiler impl detail

Let's say we have the following nested function calls:

```haskell
id (((1 + 2) + 3) + 4)
```

We can convert this to make all continuations explicit, starting at the outermost evaluation context (the very last continuation) and working inwards:

```haskell
id ((1 + 2) + 3) + 4           -- original

let k0 = \v. id v              -- the "rest of computation": calling id
in  k0 $ ((1 + 2) + 3) + 4

let k0 = \v. id v              -- next outer layer of evaluation
let k1 = \v. k0 (v + 4)    -- the "rest of computation": adding 4, then k0
in  k1 $ (1 + 2) + 3

let k0 = \v. id v              -- next outer layer of evaluation
let k1 = \v. k0 (v + 4)
let k2 = \v. k1 (v + 3)    -- etc.
in  k2 $ 1 + 2

let k0 = \v. id v
let k1 = \v. k0 (v + 4)
let k2 = \v. k1 (v + 3)
let k3 = \v. k2 (v + 2)
in  k3 1
```

This is **continuation-passing style (CPS)**. Each continuation we define represents the rest of the computation at each point. When translating, we work from the outside in, starting from the minimal "rest of the computation" and using that to build up progressively more complex and computationally involved "rest of the computation"s that rely on the previous ones. We can flip this the other way around—going inside out—to get something very close to machine code:

```haskell
let k4 = 1
let k3 = k4 + 2
let k2 = k3 + 3
let k1 = k2 + 4
in
	id k1
```

In **continuation-passing style (CPS)**, all computations are expressed this way. So a computation that adds 4 to a value might be represented as:

```haskell
add4 :: Int -> (Int -> a) -> a
add4 v = \k. k (v + 4)
```

This basically says: `add4` is a function that takes a number `v` to add four to, and the continuation `k` of this `add4` expression. It adds `4` to `v`, then calls the rest of the computation—the *continuation* `k`—on that result. In our example above, we didn't parameterize our continuations on the continuation, instead just inlining that definition directly. Both can be considered in CPS form.

Why would we want to represent programs in this way?

1. As mentioned above, it makes control explicit in functional programming
2. We can [[flanaganEssenceCompilingContinuations1993|use this as an IR]] for compilers
	1. The form is closer to machine code—explicit control and sequencing.
3. There's a [[appelSSAFunctionalProgramming1998|clear correspondence between SSA and CPS]].
	1. We can use the same algorithm for getting one to get the other!

# Continuations as a control abstraction

> [!note] See also
> https://en.wikipedia.org/wiki/Continuation

So, let's switch gears and change from looking at continuations as a compiler implementation detail (i.e., an intermediate representation of programs to facilitate optimization), and instead look at continuations as a way to *represent control flow features of a language*, a conceptual tool that forms the theoretical underpinnings of disparate concepts like exceptions, generators, and coroutines.

A continuation **represents the control state of a program**. A continuation is a data structure that represents the computational process at a given point in its execution. The **current continuation** is the continuation derived from the current point in a program's execution.

## First-class continuations

Remember that a continuation with respect to a program point is just whatever the rest of the program is from that point onwards.

With first-class continuations, there is a language-level construct that represents "the rest of computation at this point." In other words, continuations become things that are available and exposed to the programmer to manipulate and act on in the language. We say that first-class continuations **reify** program state—they make implicit program state visible.

As a consequence, this means that first-class continuations give us the ability to store, reference, and act on the *execution state of the program* from the language! With first-class continuations, we can jump back to that continuation: we can restore the execution state from that continuation's perspective—whatever was "the rest of the program" at that point.

## First-class continuations in practice: `call/cc`

> [!note] See also
> https://en.wikipedia.org/wiki/Call-with-current-continuation

To get our feet wet, let's look at the *call-with-current-continuation* operation in Scheme, `call/cc`, which implements first-class continuations. Remember the example from the very beginning:

```scheme
(if (< foo 10) (+ 32 5) (+ 7 bar))
```

Remember that we said that the continuation of this expression with respect to `(< foo 10)` is the rest of the computation at this point, which takes the result of `(< foo 10)` as its argument:

```scheme
(lambda (c) (if c (+ 32 5) (+ 7 bar)))
```

`call/cc` takes in one argument, a function `f`, and passes in the current continuation to `f`. So for example, if we were to do the following:

```scheme
(if (call/cc f) (+ 32 5) (+ 7 bar))
```

...this would pass the continuation at that point into `f`, like so:

```scheme
(f (lambda (c) (if c (+ 32 5) (+ 7 bar))))
```

However, please note **those two expressions are not equivalent!** `(if (call/cc f) #t #f)` is NOT the same as `(f (lambda (c) (if c #t #f)))`. In particular, if and when the function `f`  ever calls its argument continuation, control flow is immediately returned to that continuation at that point; in other words, calling the continuation *replaces the existing continuation with that continuation and the argument that was passed into it*. This means that whatever else happens in `f` after that continuation call **is ignored**. For example, let's say `f` is defined as follows:

```scheme
(define (f k)
  (k #t)
  0)
```

Manually passing in a continuation into `f` would just result in the expression returning `0`, since that's what `f` returns:

```scheme
(f (lambda (c) (if c (+ 32 5) (+ 7 bar))))  ; => 0
```

However, when we do `call/cc`, when `(k #t)` is evaluated in `f`, we pretend as if the `call/cc` expression had returned `#t`. More precisely, we switch control flow back to the continuation with the argument `#t`, setting all execution state to where `call/cc` was called, and making it seem as if `call/cc` had returned `#t` (i.e., we completely forget that we were executing `f`, and so never return `0`):

```scheme
(if (call/cc f) (+ 32 5) (+ 7 bar))  ; => 37
```

So overall,  `call/cc` takes a "snapshot" of the current control state of the program—*reifying* it as a lambda function representing the rest of this program, taking in the current expression as its argument—and applies `f` to this state. Then, when `f` calls its argument continuation `k` with argument `x`, we completely forget about our current execution state in `f`, and switch back to execution state when `k` was the continuation, assuming that `x` was the result of the current expression and passing that into `k`.

Note that the call to `k` doesn't even have to be inside `call/cc`! Here's an example of an infinite loop from [here](https://matt.might.net/articles/programming-with-continuations--exceptions-backtracking-search-threads-generators-coroutines/):

```scheme
(let ((start #f))
  
  (if (not start)
      (call/cc (lambda (cc)
                 (set! start cc))))

  (display "Going to invoke (start)\n")
  
  (start))
```

## Saving and returning

> [!note] See also
> http://dmitrykandalov.com/call-with-current-continuation

Because the argument `call/cc` passes to `f` isn't just a regular degular function, but is a *continuation*—a snapshot of program execution state—we can save this continuation to other places and call to it repeatedly. Whenever we do this, we reset our program state to as it was in that continuation! For instance:

```scheme
(define (print message)
    (display message)
    (newline)
)
(define (main args)
    (define count 0)

    (print (+ 100 (call/cc (lambda (continuation)
        (set! saved-continuation continuation)
        (continuation 100)
        (print "🙈")
    ))))

    (if (< count 3) (begin
        (set! count (+ 1 count))
        (print "🚀")
        (saved-continuation count)
    ))
)
```

In `call/cc`, we save the continuation at that point (right before we return the argument to `print`) into a variable `saved-continuation`. Later on, whenever we call back to `saved-continuation`, we jump execution back to where we were when `call/cc` was called! It's kind of like a `goto`, in that sense. Calling `(call/cc f)` passes the current continuation object—a `goto` to the current place in the program—into `f`.

Importantly, this means that continuation objects—the thing `call/cc` creates and passes into `f`—can be called at *any* point in the program, and will have the same effect at any point in the program—it switches program state back to where the continuation was created.

## Coroutines with `call/cc`

> [!note] See also
> For more information on coroutines, see [[mouraCoroutinesLua2004|Coroutines in Lua]]!

So really, the effect of `call/cc` is just to *reify* a continuation at some point, and provide that to a function, which decides what to do with that continuation. Whenever a continuation is called anywhere in the program, execution state jumps back to that continuation. This means that within `call/cc`, we don't even need to call the coroutine passed into `call/cc`—we can call whatever continuation we want, just as we can do anywhere else in the program!

We can use this to implement **coroutines**, a kind of async/await-style execution delegation. As [[mouraCoroutinesLua2004|Coroutines in Lua]] states, coroutines have two properties:

![[mouraCoroutinesLua2004#What the hell is a continuation|Coroutines in Lua]]

Basically, a coroutine is a temporarily suspendable function. We can *yield* control back to the function that called the coroutine, and *resume* the coroutine from where it left off later on. Here's how we do this. Let's define a generator function that takes an argument `yield`: a function that jumps back to whoever called this function:

```scheme
(define (f yield)
    (print 2)
    (yield)
    (print 4)
    (yield)
    (print 6)
)
```

We can define a function `make-coro`, which takes functions like `f` as an argument. This function internally defines two functions: `resume`, called from the calling function, which creates a continuation in the calling function and jumps into the saved continuation in `f`, and `yield`, which creates a continuation in the called coroutine and jumps into the saved continuation for the calling function:

```scheme
(define (make-generator callback)
    (define (yield)
        (call/cc (lambda (continuation)
            (set! yield-point continuation)
            (jump-out #f)
        )))
    (define (resume)
        (call/cc (lambda (continuation)
            (set! jump-out continuation)
            (yield-point #f)
        )))
    (define yield-point #f)
    (set! yield-point (lambda (_)
        (callback yield)
        (jump-out #f)
    ))
    resume
)
```

Then, usage of this construct is as follows:

```scheme
(define (main args)
    (print 1)
    (define resume (make-generator f))
    (resume)
    (print 3)
    (resume)
    (print 5)
    (resume)
    (print 7)
)
```

## What are the drawbacks?

From https://okmij.org/ftp/continuations/against-callcc.html:

> Offering call/cc as a core control feature in terms of which all other control facilities should be implemented turns out a bad idea. Performance, memory and resource leaks, ease of implementation, ease of use, ease of reasoning all argue against call/cc.

## What else can you do with this?

> [!note] See also
> https://en.wikipedia.org/wiki/Continuation

Turns out, a ton of different language features that involve jumping execution around can be implemented with `call/cc` (i.e., first-class continuations)!

> [!danger] TODO

# Delimited continuations

> [!note] See also
> https://en.wikipedia.org/wiki/Delimited_continuation

Delimited continuations are to continuations what hygienic macros are to macros, kind of. Where continuations are very powerful, they can also come with some drawbacks, as we elaborate above.

A **delimited continuation** is a "slice" of a continuation frame that has been reified into a function. Basically, instead of reifying "the rest of the program" as a continuation, we reify "a *portion* of the rest of the program" as a continuation, where we get to choose what that part is. Additionally, in this world, continuations now *return values*, meaning they can be reused and composed.

What does that mean? Well, let's look at an example. Just as `call/cc` is one particular implementation of continuations in Scheme, `shift/reset` is one particular implementation of delimited continuations! Here's an example:

```scheme
(* 2 (reset (+ 1 (shift k (k 5)))))
```

We have two new operations. `(shift k BODY)` reifies a continuation at some point in the program, binding the continuation to `k` and making it usable in `BODY`. `reset` *delimits* the boundaries of what reified continuations can reference; it defines the end of "the rest of the program." Thus, the "rest of the program" that the continuation `k` represents is `(lambda (x) (+ 1 x))`.

Additionally, unlike in `call/cc`, where calling the continuation results in special behavior that performs a kind of goto, here, `k` is just a regular degular function representing the delimited continuation at that point, and returning the value of the delimited continuation when passed in some value. So `k` is literally equivalent to `(lambda (x) (+ 1 x))`.

The special sauce here is in `reset` and `shift`. Whatever value returned by `BODY` in `(shift k BODY)` will be the value that replaces the `reset` expression. Then, execution continues normally from there.

But what if we have multiple calls to `shift`?

```scheme
(reset
  (begin
    (shift k (cons 1 (k (void))))
    (shift k (cons 2 (k (void))))
    null))
```

In the first `shift`, the continuation is `(begin * (shift ... ) null)`. In the second `shift`, the continuation is `(begin * null)`. Thus, in the second continuation, we would return `(cons 2 null)`, meaning from the first, we'd return `(cons 1 (cons 2 null))`! It's `yield`!

You can also use this for `try/catch`. See [this gist](https://gist.github.com/sebfisch/2235780) for details.
