---
aliases:
  - Automata via macros
  - The Swine Before Perl
tags:
  - reading
year: 2006
authors:
  - Krishnamurthi, Shriram
status: Todo
source: http://www.journals.cambridge.org/abstract_S0956796805005733
related: 
itemType: journalArticle
journal: Journal of Functional Programming
volume: 16
issue: 3
pages: 253
DOI: 10.1017/S0956796805005733
scheduled: 2024-08-06
---
Basically, an expository paper about implementing a DSL—specifically, a regex automata DSL—using Racket (then DrScheme)'s hygienic macro system. The benefit of doing this is that we can abstract over implementation. The paper is a pedagogic example of the use of macros!

Basically, Racket becomes a *compiler* from a language for automata to Racket source code.

In racket, `syntax-rules` is basically macro pattern-matching. Its first argument is a set of symbols to treat literally. We then have a bunch of pattern matching things, and what to generate based on it.

```scheme
(define-syntax process-state
  (syntax-rules (->)
	[(_ (a -> b) ...) body...]))
```

