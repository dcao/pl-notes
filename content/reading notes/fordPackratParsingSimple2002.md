---
aliases:
  - "Packrat parsing: simple, powerful, lazy, linear time, functional pearl"
  - "Packrat parsing"
tags:
  - reading
year: 2002
authors:
  - Ford, Bryan    
status: Todo
source: https://dl.acm.org/doi/10.1145/583852.581483 
related:  
itemType: journalArticle  
journal: "SIGPLAN Not."  
volume: 37  
issue: 9   
pages: 36–47  
DOI: 10.1145/583852.581483
scheduled: 2024-08-08
---
**Packrat parsing** gives us "the simplicity, elegance, and generality of the backtracking model, but eliminates the risk of super-linear parse time, by saving all intermediate parsing results as they are computed and ensuring that no result is evaluated more than once."

The main tradeoff is space. We need lots of space for memoization, but we get that very elegantly in lazy functional programming languages! No need for explicit `HashMap`s.

In return, we get linear time parsing of any LL($k$) or LR($k$) language.

# Building a parser

Packrat parsing is recursive descent parsing with some spice.

## Naïve recursive descent

Let's define a datatype to represent the result of a parse.

```haskell
data Result v = Parsed v String    -- We parsed a value, plus remainder of input
              | NoParse            -- Fail!
```

Parsing functions are pretty straightforward:

```haskell
pAdditive :: String -> Result Int
pAdditive s = alt1 where
	-- Additive <- Multitive ’+’ Additive
	alt1 = case pMultitive s of
		Parsed vleft s’ -> case s’ of
			(’+’:s’’) -> case pAdditive s’’ of
				Parsed vright s’’’ -> Parsed (vleft + vright) s’’’
				_ -> alt2
			_ -> alt2
		_ -> alt2 
	
	-- Additive <- Multitive
	alt2 = case pMultitive s of
		Parsed v s’ -> Parsed v s’
		NoParse -> NoParse
```

This is backtracking, and it's exponential.

## Adding memoization

Instead, we can build a memoization table, kinda like the [[parsing#LL(1) parsing|LL(1) parsing]] table, where each row is a nonterminal and each column is a position in the input. At each point, we store the parsed value, and the column number corresponding to where the rest of the input starts:

![[Screenshot 2024-08-09 at 3.47.38 PM.png]]

To build this table, we can start from the bottom right and move right-to-left. Within each column, we move bottom-to-top. i.e., outer loop is right-to-left, inner is bottom-to-top.

This gets us linear runtime, even with backtracking. This also gives us *unlimited lookahead*. However, doing this manually builds lots of unneeded results, and we have to carefully order how the results in a particular column are calculated!

## Packrat parsing

This is lazy memoization basically. A lazy functional language is an ideal place to implement this, since it owes itself well to not needing explicit memoization structures to keep track of this info.

Now, we create a struct representing a column of our memoization table. Additionally, a `Parsed` value now corresponds to the tuple of parsed value and forward pointer to a column in our memoization table above!

```haskell
data Derivs = Derivs
	{ dvAdditive :: Result Int
	, dvMultitive :: Result Int
	, dvPrimary :: Result Int
	, dvDecimal :: Result Int
	, dvChar :: Result Char
	}

data Result v = Parsed v Derivs
              | NoParse
```

We modify nonterminal parsing functions accordingly to take this into account:

```haskell
pAdditive :: String -> Result Int
pAdditive s = alt1 where
	-- Additive <- Multitive ’+’ Additive
	alt1 = case pMultitive s of
		Parsed vleft d’ -> case dvChar d’ of
			Parsed '+' d'' -> case dvAdditive d'' of
				Parsed vright d’’’ -> Parsed (vleft + vright) d’’’
				_ -> alt2
			_ -> alt2
		_ -> alt2 
	
	-- Additive <- Multitive
	alt2 = dvMultitive d
```

Finally, we create a special top-level function `parse` to tie up all this recursion:

```haskell
-- Create a result matrix for an input string
parse :: String -> Derivs
parse s = d where
	d    = Derivs add mult prim dec chr
	add  = pAdditive d
	mult = pMultitive d
	prim = pPrimary d
	dec  = pDecimal d
	chr  = case s of
		(c:s’) -> Parsed c (parse s’)
		[] -> NoParse
```

There's some mutual recursion stuff hapening with `d`! This only works in a lazy language. We only evaluate what we need to, and every column is only evaluated at most once by recursive calls of `parse`. Nuts.

> [!note] Handling right-recursion
> We convert it to left-recursion lmao.

> [!danger] TODO
> There's some other extra add-ons; I've skipped those for brevity.