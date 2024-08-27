---
aliases:
  - Can programming be liberated from the von Neumann style? a functional style and its algebra of programs
  - Can programming be liberated from the von Neumann style?
tags:
  - reading
year: 1978
authors:
  - Backus, John
status: Todo
source: https://dl.acm.org/doi/10.1145/359576.359579
related: 
itemType: journalArticle
journal: Commun. ACM
volume: 21
issue: 8
pages: 613–641
DOI: 10.1145/359576.359579
scheduled: 2024-08-05
---
# Introduction

People keep adding shit onto languages. It's too much.

# Motivation: imperative languages suck

## Models of computing systems

Languages are built around *models* of computing systems. These models have three features: **foundations** (is it mathematically elegant), **history sensitivity** (is there a notion of storage), **semantics**, and **program clarity**. There are three common ones:

- **Simple operational models**, e.g., Turing machines. Concise and useful foundations, history sensitive, simple semantics based on state transitions, but with unclear programs.
- **Applicative models**, e.g., lambda calculus and other languages in this paper! Concise and useful foundations, not history sensitive, reduction semantics w/o states, clear programs.
- **Von Neumann models**, e.g., conventional languages. Complex mathematical foundations, history sensitive, complex state machine semantics, moderately clear programs but not useful conceptually.

## Von Neumann computers

Conceptually, a program's job is to change memory in some way. In a von Neumann computer, we basically have a CPU that communicates via a tube with a memory store by sending single words back and forth. This means we have to address single elements of our memory store at a time. Backus calls this the *von Neumann bottleneck.*

## Von Neumann languages

The assignment statement is the von Neumann bottleneck of typical languages (e.g., ALGOL at the time). We want to do big alterations to our memory, but can only do so one word (in the memory sense) at a time. We do `v[0] = x`, then `v[1] = x`, ...

Von Neumann languages also separate expressions from statements, which are mathematically yikes.

He thinks most functional programs are inefficient and lack capacities for storing state.

> [!note]
> We now know the above has been addressed by systems like e.g., Haskell.

## Comparison of von Neumann and functional programs

He compares an imperative inner product with what is basically an APL point-free implementation. Key properties:

- All we have is function application; no internal state.
- It's hierarchical, static, and nonrepetitive—the structure is helpful for understanding it but you don't need to mentally execute it
- Operates on whole conceptual units—the whole array, not just individual words—and is thus completely general.
- Arguments are unnamed
- It uses higher-order operators like function composition that can be reused

## Language frameworks vs changeable parts

The language provides a framework—things about the language you can't change. Scheme has a very small framework and large changeable parts—the macro system means you can define anything really! Most imperative languages are the opposite, since their semantics is very closely related to state, and you need lots of features to prop up this style.

## Changeable parts and combining forms

Additionally, Backus thinks imperative languages' divide between expressions and statements makes composition difficult. And the naming conventions—call-by-value, call-by-name, ...—make it harder to use simple combining forms.

## APL versus word-at-a-time

APL still has expressions. Not good enough.

> [!note]
> At the time APL's adverbs weren't that developed.

## Von Neumann languages lack useful mathematical properties

Side effects & aliasing make it hard to do math. Denotational semantics for imperative languages is so complicated. Axiomatic semantics works, but normally restricts the subset of the language it considers, and means it can't cover real-world programs.

# Alternatives

## Functional programming systems

Not to be confused with functional programming! In this setup, we only have point-free programming. We have objects, functions, functional forms (i.e., higher-order functions), and application. It's kinda like J—a limited form of higher-order functional programming.

It's simple, even simpler than lambda calculus, because variable substitution is way simpler when you can't define lambdas lmao

## The algebra of programs

Defining an algebra that operates on programs so that "the average programmer" can prove correctness of their programs.

## Formal systems for functional programming

You can define your own functional forms!

## Applicative state transition system

FFP but with state.