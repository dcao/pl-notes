> [!summary]
> The key difference: **projectional editors directly manipulate ASTs.**
> 
> ![[Screenshot 2024-08-20 at 2.00.55 PM.png]]

# What are projectional editors?

- Projectional editors directly manipulate ASTs
- Facts
	- CS perf isn't bimodal
	- Experts perform equivalently with projectional / ...
	- For novices to a given language (not necessarily to CS) projectional editors make users more productive
- Structure ~ structured ~ projectional
- What do a compiler do?
	- [[parsing|Lexes/parses]] syntax into AST
	- Then codegen from AST
	- Abstract: drops some detail of syntax (e.g., semicolons, parens), only repr what we need for codegen
	- Syntax: we're representing/mirroring syntactic structure of code in question
	- Tree: it's a tree
- Programs are data!
	- We can programmatically build ASTs
	- A **projectional editor** lets us build the AST directly!
		- "Directly" is a site of contestation
- Projectional is a feature of the *editor*, not the *language*
	- What is the interface that we're using to build a program?
	- PL goes from AST to code gen. Gives semantics, meaning to AST
	- Programming environment is whatever we use to build AST.
- Projectional vs. visual
	- Projectional is any editor, textual or visual, where you build up programs by directly interacting with ASTs
		- e.g., Paredit !!
	- Visual is any editor, projectional or not, where programs are built by any means other than text in textbox
		- e.g., squarespace
- Syntax vs. logical errors

# When should we use projectional editors?

- For familiar languages, text- and structure-based are similar
	- The more a person learns, the more a person uses text (though not always more than structure)
- Beginners feel better about CS when starting with structure editors
- For unfamiliar languages, structure editors are more efficient.
- But, not a good substitute for pseudocode!

Importantly:

> People learn just as many computing skills with them, can transfer knowledge to other programming environments, and can use the same programming languages and write the same programs in both kinds of environments.
