---
aliases:
  - "DART: directed automated random testing"
  - "DART"
tags:
  - reading
year: 2005
authors:
  - Godefroid, Patrice
  - Klarlund, Nils
  - Sen, Koushik    
status: Todo
source: https://dl.acm.org/doi/10.1145/1065010.1065036 
related:  
itemType: conferencePaper  
location: New York, NY, USA   
pages: 213–223  
DOI: 10.1145/1065010.1065036  
ISBN: 978-1-59593-056-9
scheduled: 2024-08-10
---
> [!note] See also
> These notes are essentially a retelling/rewording of [[CS 264 Notes#DART and CUTE Concolic Testing|my original notes on this paper from CS 264]]. I'm doing this for clarity and to provide some more background.

# Automated test generation, i.e., fuzzing

When we're programming, we often want to *automatically generate unit tests* to verify the correctness of our programs. In particular, with these tests, we're focused on testing that our program doesn't exhibit any weird unexpected behaviors: exceptions, memory errors (e.g., SEGFAULTs), etc.

> [!warning]
> Automated test generation normally isn't concerned with testing for correctness—i.e., that a function does "the thing you expect it to do." This is more the domain of *software verification*; formally verifying that a program does what you want it to under all circumstances.

As a result, the goal of **automated test generation** is to generate unit tests that exercise *as many execution paths as possible*, in order to detect if any of those paths may cause the exceptional conditions listed above.

## Naïve approach: symbolic execution

One potential naïve approach is to do *symbolic execution*: we go through the program, collecting a symbolic **path constraint** at each point—the symbolic constraints that direct execution in that direction—then use a constraint solver (e.g., an an [[SAT and SMT solving|SMT solver]]) to find concrete values for each execution path, generating unit tests thusly. However, SMT solvers used to be (and still are) slow as fuck, and trying to keep track of all symbolic paths can lead to a path explosion.

# DART and concolic execution

The key is to use both concrete and symbolic values! Here's the loop for how we generate test cases:

1. Start with a random concrete variable assignment.
2. As we execute, keep track of our symbolic path constraint under this assignment. Since we're only keeping track of this one execution path, there's no path blowup.
3. Once we're finished, negate parts of the path constraint to generate a new unseen path. Then use our SMT solver to generate a new assignment that will follow this path.
4. Repeat.

In this setup, we trade completeness for efficiency:

- If we have constraints that an SMT solver can't solve, we can replace those (e.g., non-linear) terms with the concrete value of that term in this execution. This is sometimes inaccurate, but guarantees us efficiency.
- For loops, we just run them a finite number of times. We're not trying to prove universal correctness, unlike with software verification!

Potential optimizations:

- Simplify symbolic exprs on the fly
- Incremental constraint solving

> [!warning]
> For more on symbolic execution and test generation, see [[CS 264 Notes]].

# DART in practice

There are a few extra things to make this work in practice:

- You need a way of automatically detecting what the variables you're allowed to change are. The paper calls this **interface extraction**, where external variables/functions are things reported as "undefined reference" when the program is compiled, along with arguments to a user-specified *top-level function*.
- You need to generate a test driver that does this work.
- You need to instrument the program with stuff for symbolic execution.

