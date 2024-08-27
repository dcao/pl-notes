---
aliases:
  - "On implementing Prolog in functional programming"
tags:
  - reading
  - artificial-intelligence
  - continuations
  - functional-programming
  - interpreters
  - logic-programming
  - prolog
year: 1984
authors:
  - Carlsson, Mats    
status: Todo
source: https://doi.org/10.1007/BF03037326 
related:  
itemType: journalArticle  
journal: "New Generation Computing"  
volume: 2  
issue: 4   
pages: 347-359  
DOI: 10.1007/BF03037326
scheduled: 2024-08-13
---
> [!summary]
> How continuations lets us do goal-solving with backtracking and such!

This paper explains how [[continuation-passing style|continuations]] can be a useful tool in implementing the semantics of [[Prolog]]. Specifically, Prolog requires that in order to solve goals, we be able to *backtrack*: try out different solutions, give up, and go back and try other solutions. Instead of using explicit stacks and assignments to machine registers, we can use recursion, continuations, and parameter passing.

> [!note]
> The correspondence between machine registers and parameter passing is reminiscent of [[appelSSAFunctionalProgramming1998|SSA is functional programming]]!

