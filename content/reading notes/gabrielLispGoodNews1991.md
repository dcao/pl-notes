---
aliases:
  - Worse Is Better
  - "Lisp: Good News, Bad News, How to Win Big"
tags:
  - reading
year: 1991
authors:
  - Gabriel, Richard P.
status: Todo
source: https://naggum.no/worse-is-better.html
related: 
itemType: webpage
scheduled: 2024-08-05
---
Why didn't Lisp catch on? Especially Common Lisp, even though it was standardized?

This author argues that the **worse-is-better** paradigm for designing languages and systems—prioritize simplicity of implementation over all else—is better suited for higher-adoption tools.

# Lisp's successes

- It was **standardized** in the 80s
- It **performs well**.
- It has **lots of nice dev features**: incremental compilation, symbolic debugging, data inspection, debug stepping, builtin help, ==window-based debugging==, symbolic stack backtraces, structure editors
- Can integrate with C, etc. via FFI
- CLOS! OOP: multiple inheritance, generic functions, first-class classes and generic functions, metaclasses, ...

# Lisp's failures

It wasn't just about the AI winter.

Common Lisp corresponds to the MIT/Stanford school of design—being uptight about **doing the right thing**:

- Correctness: don't allow incorrectness.
- Consistency: as important as correctness. We can sacrifice simplicity and completeness for consistency.
- Completeness: cover as many situations as possible.
- Simplicity: must be simple, but is last priority. Interface simplicity over implementation simplicity.

Basically, we care a lot about theoretical elegance and consistency and niceness. By contrast, the **worse-is-better** school of thought (aka the *New Jersey approach*) is more practical:

- Simplicity: must be simple, with implementation simplicity valued more. Most important.
- Correctness: prioritize simplicity over this
- Consistency: don't be *too* inconsistent. We can sacrifice it for simplicity, but it's better to just drop parts of design that deal with one-off cases.
- Completeness: cover as much as is practical, but sacrifice for everything else. Consistency can be sacrificed for completeness if simplicity is retained, esp. consistency of interface.

Worse-is-better tends to be better for adoption. Think Unix and *C*: it's simple enough, and easy to write a decent compiler for it. Implementation simplicity is highest priority, so Unix and C are easy to port to shit machines. This allows for mass adoption.

Additionally, people writing in C assume that they're going to need to hassle to get good performance and resource use. Thus, programs written in C work well on all machines! People will be conditioned to expect less, but also lots of people will be invested in improving it until it gets almost to the perfectness of doing it right the first time. As the author puts it:

> the worse-is-better software first will gain acceptance, second will condition its users to expect less, and third will be improved to a point that is almost the right thing. In concrete terms, even though Lisp compilers in 1987 were about as good as C compilers, there are many more compiler experts who want to make C compilers better than want to make Lisp compilers better.

In Unix's case, this also encourages a culture of reuse/integration, since individual pieces aren't enough to constitute a full system on their own.

The authors likens Unix and C to *viruses* in this way. So instead of trying to design something perfect the first time, get something okay out, get adoption, then incrementally improve it.

## Good Lisp programming is hard

In C, programming is always difficult because the compiler needs so much description—but this means it's almost impossible to write poorly performing programs. In Lisp, it's very easy to fall into this rabbit hole. Did you not declare variables of the right type? Did you not write your program in precisely the right way that the optimizer can recognize? Do you know what rewrite rules your compiler will write?

## Integration is God

> In the worse-is-better world, integration is linking your .o files together, freely intercalling functions, and using the same basic data representations. You don't have a foreign loader, you don't coerce types across function-call boundaries, you don't make one language dominant, and you don't make the woes of your implementation technology impact the entire system.
> 
> The very best Lisp foreign functionality is simply a joke when faced with the above reality. Every item on the list can be addressed in a Lisp implementation. This is just not the way Lisp implementations have been done in the right thing world.
> 
> The virus lives while the complex organism is stillborn. Lisp must adapt, not the other way around. The right thing and 2 shillings will get you a cup of tea.

Lisp is isolated into its own world. Things can't interoperate with it, and so it dies!

# How Lisp can win big

- Continue standardization. Don't just drop Common Lisp (this was the 90s or something)
- Don't build monolithic environments
- Implement CL as kernel + libraries—use existing C compilation infrastructure
- "Total Integration" - an integrated Lisp that interops with other languages
- Build a new worse-is-better Lisp
	- A small, easy to implement kernel language
	- A syntax layer above
	- A library on top
	- "Environmentally provided epilinguistic features"
