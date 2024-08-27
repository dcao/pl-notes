# From 294

- Need-finding (what are problems), formative (how to solve?), evaluative (did it work?)
- Need-finding means asking users to show, don't tell. Where do they get frustrated? Where do they give up?
	- If you can only interview, have people talk concrete. "What was the most annoying part of this task?"
- PLs can support many tasks
	- Incrementally adding functionality, transpiling, modifying, exploring, searching through a codebase, exploring a codebase for understanding
- Notation has a number of different cognitive dimensions
	- See [[2024-03-12 • CS 294, 7Tu – Cognitive dimensions of notation|the notes]] for full deets
	- Basically: is it easy to abstract? Is it easy to change things? What is made visible and comparable? Are the abstractions close to mental model? Are things consistent? Verbose? Mental load?
- To design a language...
	- Figure out what users need
		- Formative studies
		- Write out programs in domain and brainstorm abstractions
		- Learn how people talk about their task

See [[2024-01-30 • CS 294, 3Tu]], [[2024-03-14 • CS 294, 7Th – How to design languages]], [[2024-03-12 • CS 294, 7Tu – Cognitive dimensions of notation]].

# Considerations from languages past

- [[gabrielLispGoodNews1991|Lisp: Good News, Bad News, How to Win Big]]: simplicity and interop over theoretical perfection and monolithic systems. C sucks, but is easy to implement and works with lots of things. Easier to get fix C once adopted than make ivory tower perfect and try to get it adopted.
- [[hoareHintsProgrammingLanguage1983|Hints on Programming Language Design]]: design for clarity and ease/speed of compilation. Allow lots of overloading (broadcasting, dot notation) to allow for changing for efficient internal repr. Think Julia.
- [[hughesWhyFunctionalProgramming1989|Why Functional Programming Matters]]: higher-order functions and lazy programming lets us do modularization. infinite stream generation and taking!
- [[backusCanProgrammingBe1978|Can programming be liberated from the von Neumann style?]]: APL-style is good! No individual memory location manipulation, more big operations: `+` on arrays, etc. Hard to parallelize, statements make it hard to deal with mathematically.
- [[wadlerHowEnterprisesUse|How enterprises use functional languages, and why they don’t]]: gripes with Haskell

# Features

## Data parallelism

**Nested** data parallelism was new! Think Rayon, with work-stealing thread pool.

See [[blellochProgrammingParallelAlgorithms1996|NESL]], [[chakravartyDataParallelHaskell2007|Data parallel Haskell]].

## Datalog

- **Datalog** is a database of facts and rules to deduce new facts.
- Optimizations
	- **Semi-naïve**: new-old, old-new, new-new
	- **Magic set**: specialize functions for queries.
- **Stratified negation**: separate execution into distinct phases to enable negation.
- **Lattices, semirings**

See [[Datalog]], [[zhangBetterTogetherUnifying2023a|egglog]].

## Continuations, coroutines

See [[continuation-passing style|continuations]], [[mouraCoroutinesLua2004|Coroutines in Lua]]