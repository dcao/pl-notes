---
aliases:
  - "Mirrors: design principles for meta-level facilities of object-oriented programming languages"
  - "Mirrors"
tags:
  - reading
year: 2004
authors:
  - Bracha, Gilad
  - Ungar, David    
status: Todo
source: https://dl.acm.org/doi/10.1145/1035292.1029004 
related:  
itemType: journalArticle  
journal: "SIGPLAN Not."  
volume: 39  
issue: 10   
pages: 331–344  
DOI: 10.1145/1035292.1029004
scheduled: 2024-08-20
---
In sum, the paper proposes **three design principles** for how to implement 

# Background: metaprogramming in OOP

> [!note] See also
> https://en.wikipedia.org/wiki/Metaobject

A **metaobject** is an object that manipulates objects (including itself!). It can change an object's type, interface, class, methods, attributes, ...

The **metaobject protocol (MOP)** provides the vocabulary to access and manipulate objects. Functions of an MOP include:

- Creating/deleting new classes
- Creating new properties/methods
- Do inheritance
- Generate/change code defining methods of a class

Different implementations of a metaobject protocol can allow for different behaviors when a class is created. For example, if you want a hash table or non-hash table representation of a class, you can use different MOPs.

# Mirror-based APIs

In Java, reflection methods are inherent to `Class`. In JDI (Java Debugging Interface), they make reflection items (`Class`, `Method`, etc.) *interfaces*, allowing for different concrete representations of the reflected items for e.g., different platforms. Benefits:

- **Encapsulation**. Meta-level facilities encapsulate their implementation
- **Stratification**. Meta-level facilities are separated out, e.g., to minimize bin size.
- **Structural correspondence**. Every language construct is mirrored, including things like modules, import/export statements, statements, ...