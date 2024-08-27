---
aliases:
  - How enterprises use functional languages, and why they don’t
tags:
  - reading
year: 
authors:
  - Wadler, Philip
status: Todo
related: 
itemType: journalArticle
journal: ""
scheduled: 2024-08-05
---
# People use FP

- HOL, Isabelle theorem provers
	- Written in ML, the metalanguage for another theorem prover!
	- We need typed higher-order functions to deal with tactics and goals and all that, which are functions from proofs to other things
- Erlang
	- Message-passing
	- Lots of tail-calls: server receives a message with a new function for the server, applied with tail-call.
- Pdiff
	- ...
- CPL/Kleisli
	- A high-level language for formulating database queries that touch multiple databases in disparate format, and the system that implements it.
	- Used in bioinformatics
	- CPL is a functional language, allowing for (nested) set comprehensions
	- We can do term rewriting! We also exploit record subtyping!

# Why nobody uses it

- Compatibility with FFI, etc.
- Libraries
- Portability
- Availability (i.e., guaranteed support)
- Footprint (packaging standalone programs)
- Tooling
- Training (to get people used to syntax)
- Popularity

## How to fix that

- **Killer apps** that languages are developed around
- **Shifting research emphasis** to not just develop systems in the ivory tower
- Having FFI, debugging, and profiling soon

