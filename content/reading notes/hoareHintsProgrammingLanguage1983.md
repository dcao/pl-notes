---
aliases:
  - "Hints on Programming Language Design"
tags:
  - reading
year: 1983
editors:
  - Horowitz, Ellis
authors:
  - Hoare, C. A. R.    
status: Todo
source: http://link.springer.com/10.1007/978-3-662-09507-2_3 
related:  
itemType: bookSection  
publisher: Springer Berlin Heidelberg  
location: Berlin, Heidelberg   
pages: 31-40  
ISBN: 978-3-662-09509-6 978-3-662-09507-2
scheduled: 2024-08-05
---
This essay is Hoare hating on language features he doesn't like.

# Introduction

Hoare (as in quicksort, [[2024-07-17 • axiomatic semantics, domain theory|Hoare logic]], and null) thinks PLs should be designed for programmer ease-of-use, instead of machine independence, spec stability, familiar notation, large libraries, etc. This consists of three main things to optimize for:

- **Program design**: making a spec for the program and its subproblems
- **Programming documentation**: should be an "integral part of the process of design and coding."
- **Program debugging**: notation should eliminate errors or make them detectable by compiler. There should be *security*—no machine-dependent bugs. Compiler has to be compact, reliable, and fast

Thus, we should emphasize simplicity of language—programmer should be able to fully grasp it.

> I fear that most more modern programming languages are getting even more complicated; and it is particularly irritating when their proponents claim that future hardware designs should be oriented towards the implementation of this complexity.

# Discussion

Hoare has five key principles for good language design: **simplicity, security, fast translation, efficient object code, and readability**. He thinks other designers fail to meet these standards.

- **Simplicity**
	- isn't modularity - being able to get by with part language understanding
	- orthogonality of design - adding complex integers because we have reals/ints and complex reals
- **Security**
	- The compiler should help user find bugs!
	- We shouldn't need different compilers for dev and prod!
- **Fast translation**
	- We need more than just incremental/independent compilation.
	- This forces people to do weird module restructuring things
- **Efficient object code**
	- Languages should be designed around generating efficient code. We shouldn't just rely on optimizing compilers to do everything
- **Readability**

# Comment conventions

We want comments to be able to appear near/after code.

# Syntax

Syntax should be chosen to enable fast lexing and precise error recovery—checking the rest of the program even in the face of a syntactic error. This means state-machine-based lexing and restricted context-free grammars.

# Arithmetic expressions

Consider special notation for matrix, list operations. This is broadcasting and dot method notation!

```
A. + B
L1.append(L2)
F.output(x)
```

Languages like APL make it difficult to swap to other internal representations that are more efficient. Hoare thinks we can get this with:

1. An efficient base language
2. Use overloading a ton. No syntactic extension
3. No automatic type coercion.

# Program structures

`for, fn, if` are way better than *goto*. Improves optimization, helps programmer. We need these (and not just functional notation) for performing side-effects, for convenience, efficiency, I/O.

Apparently Hoare invented this construction:

```
case i of
  {b1, b2, b3}
```

Before a switch made you assign a variable to a list of labels; you then jumped to an index in that list of labels, with goto. Weird.

# Variables

Basically, fuck pointers. In machine code, it's impossible to tell what register or memory location an instruction is altering. Variables in higher-level languages make it clear what's being modified. Without pointers, we know that variables are disjoint.

Once we have pointers or referencing, we can have [[sridharanAliasAnalysisObjectOriented2013|aliasing]], along with arbitrary modification of random parts of the machine state:

```
x := y      // always changes x
x := y + 1  // depending on semantics, could change value of other variable
               really this means *x = *y + 1
```

> Their introduction into high-level languages has been a step backward from which we may never recover.

# Block structure

Lexical scope makes association between variable and scope clear, and allows for some optimization.

# Procedures

Function calls need to be as efficient and correct as possible. Hoare's gripes with FORTRAN's function calls:

- Doesn't distinguish between in/out params. We're back to machine code programming!
- Independent compilation prevents comptime checks on param passing
- Defining side effects of function calls negates advantages of arithmetic expressions.

# Types

Use static typing. Dynamic typing is unpredictable/error-prone, can be inefficient, makes the language complicated, makes it harder to introduce "genuine language extensibility." Types also help with documentation. We should have unit types!