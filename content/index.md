---
title: David's PL Notes
---

# About this website

Welcome to [David's](https://cao.sh) PL Prelim Notes! This website contains a bunch of notes on topics on programming language (PL) implementation and theory. This site might be useful for you for a few reasons:

- You're currently studying for the [UC Berkeley PL Prelim](https://docs.google.com/document/d/1HbkKsJ1iJSXSGZ9C_gIlVJbiDjiuDUQDp1YT-QalStM/edit), and you're looking for topics to study, resources for those topics, and general notes on the relevant topics.
- You're interested in PL generally, and are looking for readings & notes on a survey of different PL-related topics.

In either case, this site has a bunch of resources that might be helpful for you! Specifically, we have:

- A **syllabus** (see below) of different topics and readings that cover a broad range of PL topics.
- **Reading notes** on individual readings with respect to these topics.
- **Topic notes** that synthesize multiple (some of the reading notes do this as well)
- **Study guides** that summarize 

I originally wrote these notes in preparation for the Berkeley PL Prelim, so they're provided *as-is*; I basically haven't changed them since I copy-pasted them here, so a lot of them might make reference to Prelim-related things.

If you have any questions, feel free to email me (it's on my website linked above).

> [!warning] Formatting caveats
> As a consequence of me manually copy-pasting my notes to this site, there might be missing pages; this is unintentional, and you should let me know if you run into this!
>
> Additionally, type judgments/derivations will look weird---they're missing the horizontal line dividing consequence and consequent, because of LaTeX rendering weirdness with the static site generator I'm using. They'll look like this:
> $$
> \begin{prooftree} \AXC{$\Gamma(x) = T$} \UIC{$\Gamma \vdash x : T$} \end{prooftree}
> $$
>
> Apologies in advance :^)


## Extra Prelim-related notes

From the syllabus:

> Keep in mind that some topics---for example language design and implementation---are rather broad. It is expected that students can answer reasonable open-ended questions that go beyond the content of papers listed below.

...and something else somebody told me at some point:

> Since this prelim is about understanding of topics, checking off the readings probably won't be sufficient. Completion is finished when you understand the topic, and you should definitely add additional readings to the topics where needed.

> [!info] Legend
> - [ ] Reading or topic
> - [x] Completed (or skimmed) reading or topic
> - [ ] ==Missing reading==
> - [ ] % Optional (prepended with a `%`)

## Extra resources

[This folder from Manish](https://drive.google.com/drive/u/1/folders/17rKZIkXb-PhlIC55hl-EKRao6JItO8YD) contains past resources, including the CS 164 course reader, past schedules, past notes, and textbook PDFs.

These links also have some more readings if needed:
- https://dr.lib.iastate.edu/entities/publication/44b6d741-2fb8-4094-88ff-f7baa4ce7042
- http://www.cs.cmu.edu/afs/cs.cmu.edu/user/mleone/web/language-research.html

# Scheduled study

> [!quote]- Schedule from Notion
> ![[Screenshot 2024-08-26 at 2.28.01 PM.png]]

- [x] [[2024-06-17 • lambda calc]] 🔁 every week on Wednesday ⏳ 2024-06-19T14:30 ✅ 2024-06-19
- [x] [[2024-06-26 • type system extensions]] 🔁 every week on Wednesday ⏳ 2024-06-26T14:30 ✅ 2024-06-26
- [x] [[2024-07-03 • denotational semantics and fancy types]] 🔁 every week on Wednesday ⏳ 2024-07-03T14:30 ✅ 2024-07-05
- [x] [[2024-07-10 • optimizations and gc]] ✅ 2024-07-24
- [x] [[2024-07-17 • axiomatic semantics, domain theory]] ✅ 2024-07-18
- [x] [[2024-07-24 • dependent & effect types]] ✅ 2024-07-25
- [x] [[2024-07-31 • attribute grammars, ssa, cps]] ✅ 2024-07-26
- [x] [[2024-08-07 • control flow analysis & abstract interpretation]] ✅ 2024-07-30
- [x] [[2024-08-14 • program dependence graphs, program slicing, lazy abstraction]] ✅ 2024-08-06
- [x] [[2024-08-21 • auto-parallelization]] ✅ 2024-08-13

## Study guides

One-page (ish) summaries of all the topics.

- [x] [[2024-08-20 • Prelim review - STLC and friends]] ⏳ 2024-08-20 ✅ 2024-08-22
- [x] [[2024-08-22 • Prelim review - type-checking and inference]] ✅ 2024-08-22
- [x] [[2024-08-23 • Prelim review - imperative semantics]] ✅ 2024-08-23
- [x] [[2024-08-24 • Prelim review - program analysis]]
- [/] [[2024-08-25 • Prelim review - language design and features]]
- [x] [[2024-08-25 • Prelim review - compiler innards]]
- [/] [[2024-08-26 • Prelim review - testing and verification]] ✅ 2024-08-26

## Extra topics

Extra notes on topics that weren't explicitly scheduled, or that aren't explicitly mentioned in the syllabus but are things we're expected (?) to know.

- [/] [[continuation-passing style|continuations]]
- [x] [[parsing]] ✅ 2024-08-09
- [/] [[SAT and SMT solving]]
- [x] [[program synthesis]]
- [x] [[Datalog|Datalog]] ✅ 2024-08-21
	- [x] [[zhangBetterTogetherUnifying2023a|egglog]] maybe ✅ 2024-08-21
- [x] [[register allocation]] ⏳ 2024-08-20 ✅ 2024-08-21
	- [x] the general [[compiler]] pipeline ✅ 2024-08-22
- [x] [[semantic analysis]] and implementing type-checking and inference ✅ 2024-08-22
- [/] [[interprocedural analysis]]
- [/] [[dataflow programming]]
- [ ] concurrency, memory consistency?
- [ ] proof assistants??

# Syllabus

## Languages

> [!info] Goal
> 
> Know syntax, major features, and implementations of these languages. Be able to critique features (see [[#Topics/features to know]]) and program and give examples in several of these languages.
> - C
> - C++ (classes, inheritance, templates)
> - Java (reflection, generics)
> - Python, Ruby
> - Prolog and Datalog
> - ML (type inference)
> - Scheme (continuations, dynamic typing, macros)

### The art of language design

Lightweight intro to (complexity of) PL design, broad motivating ideas behind (and *critiques of* various langs.

- Functional programming
	- [x] [[backusCanProgrammingBe1978|Can programming be liberated from the von Neumann style?]] ✅ 2024-08-06
		- Backus' "functional programming" is actually functional, point-free, and data parallel programming. He's talking about APL!
	- [x] [[hoareHintsProgrammingLanguage1983|Hints on Programming Language Design]] ✅ 2024-08-06
	- [x] [[hughesWhyFunctionalProgramming1989|Why Functional Programming Matters]] ✅ 2024-08-05
	- [x] [[gabrielLispGoodNews1991|Lisp: Good News, Bad News, How to Win Big]] ✅ 2024-08-05
- Relevance:
	- [ ] [Confessions of a Used PL Salesman](http://citeseerx.ist.psu.edu/viewdoc/download;jsessionid=43D18F7846E2EA2979C0136FDEA2C373?doi=10.1.1.118.2025&rep=rep1&type=pdf)
	- [x] [[wadlerHowEnterprisesUse|How enterprises use functional languages, and why they don’t]] ✅ 2024-08-06
	- [ ] [[appelCritiqueStandardML1993|A critique of Standard ML]]

### Additional language design notes from Sarah's 294

- [x] [[2024-01-30 • CS 294, 3Tu]] ✅ 2024-08-20
- [x] [[2024-03-12 • CS 294, 7Tu – Cognitive dimensions of notation]] ✅ 2024-08-20
- [x] [[2024-03-14 • CS 294, 7Th – How to design languages]]

### Topics/features to know

- Macros (syntactic abstraction):
	- [/] [[krishnamurthiAutomataMacros2006|The Swine Before Perl]] (regex extensions) ✅ 2024-08-06
	- [ ] [Higher-order abstract syntax (HOAS)](https://en.wikipedia.org/wiki/Higher-order_abstract_syntax)
	- [x] https://beautifulracket.com/explainer/hygiene.html ✅ 2024-08-06
- [[continuation-passing style|Continuations]] (control abstraction)
	- [ ] [[carlssonImplementingPrologFunctional1984|On implementing Prolog in functional programming]]
	- [ ] ==usage of continuations in web frameworks==
		- [ ] https://stackoverflow.com/questions/5234514/real-world-usage-of-lua-co-routines-continuation-serialization-to-simplify-async
		- [ ] see wikipedia page for [Continuation](https://en.wikipedia.org/wiki/Continuation)
	- [x] [[mouraCoroutinesLua2004|Coroutines in Lua]] ✅ 2024-08-10
- Data abstraction and object oriented languages
	- [/] [[brachaMirrorsDesignPrinciples2004|Mirrors: design principles for meta-level facilities of object-oriented programming languages]]
- declarative (i.e., search-based) programming
	- [/] [[kowalskiAlgorithmLogicControl1979|Algorithm = logic + control]]
- [[Datalog]]
	- [x] [Max's 294 course notes](https://inst.eecs.berkeley.edu/~cs294-260/sp24/2024-02-05-datalog) ✅ 2024-08-21
	- [x] [[zhangBetterTogetherUnifying2023a|Better Together: Unifying Datalog and Equality Saturation]] ✅ 2024-08-21
- data parallelism
	- [x] [[blellochProgrammingParallelAlgorithms1996|NESL]] ✅ 2024-08-20 ⏳ 2024-08-20
	- [x] [[chakravartyDataParallelHaskell2007|DPH]] ⏳ 2024-08-20 ✅ 2024-08-20
	- [x] also, Rayon!
- [[dataflow programming]]
	- [/] https://en.wikipedia.org/wiki/Dataflow_programming
	- [/] https://stackoverflow.com/questions/461796/dataflow-programming-languages

## Semantics & types

### Readings

3 TAPL chapters ~ 1 paper; do memos accordingly

- [x] TAPL: ch. 1-15 (skip 4, 7, 10), 20, 22-24 ✅ 2024-07-17
	- [x] [[pierceTAPL2002|TAPL 1, 3, 5, 6: Untyped lambda calculus]]
	- [x] [[pierceTAPL11Simplytyped2002|TAPL 8, 9, 11: Simply-typed lambda calculus]] ✅ 2024-06-25
	- [x] [[pierceTAPL12132002|TAPL 12, 13, 14: Normalization, references, and exceptions]] ✅ 2024-06-25
	- [x] [[pierceTAPL15182002|TAPL 15, 18: Subtyping & OOP]] ✅ 2024-07-02
	- [x] [[pierceTAPL20222002|TAPL 20, 22, 23, 24: Recursive, universal, and existential types]] ✅ 2024-07-17
- [x] Winskel: ch. 2, 3, 6, 7 (skip 7.1, 7.3) ✅ 2024-07-18
	- [x] see also [[denotational semantics and domain theory]]
	- [x] [[winskelWinskelDenotationalSemantics1993|Winskel 5: The denotational semantics of Imp]] ✅ 2024-07-17
	- [x] [[winskelWinskelAxiomaticSemantics1993|Winskel 6, 7, 8: Axiomatic semantics and domain theory]] ✅ 2024-07-18
- [x] Necula, CS 263: [[CS 263 - Introduction to Denotational Semantics|Introduction to Denotational Semantics]] ✅ 2024-07-18
- [x] ATTAPL: ch. 2 (dependent types), 3 (effect types) ✅ 2024-07-25
	- [x] [[pierceATAPLDependentTypes2005|ATAPL 2: Dependent types]] ✅ 2024-07-23
	- [x] [[pierceATAPLEffectTypes2005|ATAPL 3: Effect types]] ✅ 2024-07-25

### Optional

- [ ] % Girard, LaFont, and Taylor’s [Proofs and Types](http://www.paultaylor.eu/stable/Proofs+Types.html) chapters 2-7 are a remarkably compact presentation of the basic proof theory that makes types work.
- [ ] % Frank Pfenning’s [Computation and Deduction](http://www.cs.cmu.edu/~twelf/notes/cd.ps) covers similar ground, but in much greater detail. His [webpage](http://www.cs.cmu.edu/~fp/) has a number of exceptionally readable papers on computational logic.
- [ ] % The explanation of denotational semantics in John C. Mitchell’s [Foundations for Programming Languages](http://mitpress.mit.edu/catalog/item/default.asp?ttype=2&tid=3460) is extremely clear and comprehensible.  If you find Winskel to be frustrating, try this.

## Implementation, program analysis, & optimization

See [Dragon Book](https://en.wikipedia.org/wiki/Compilers:_Principles,_Techniques,_and_Tools) for general readings. See also [discussion on HN about it](https://news.ycombinator.com/item?id=14487961) for alternatives.

### Basics

- Know techniques needed to implement a modern PL [[compiler]]
	- [[parsing|Parsing]]
	- [[ahoDragonBookGrammars2007|Syntax-directed translation]]
	- [[semantic analysis|Semantic analysis]] (i.e., type-checking)
	- [[2024-07-10 • optimizations and gc|Optimization]]
	- [[register allocation|Register allocation & code generation]]
- Readings
	- Dragon Book (out of date ish)
	- CS 164?

### Extra topics

- [[parsing|Parsing]] (see [CS 164 notes](https://homes.cs.washington.edu/~bodik/ucb/cs164/sp13/lectures/09-Datalog-CYK-Earley-sp13.pdf) for first three items)
	- [x] Recursive-descent parser (in Prolog) ✅ 2024-08-09
	- [x] [Packrat](https://dl.acm.org/doi/10.1145/583852.581483) parsing ✅ 2024-08-09
	- [x] CYK parser (how to express this in Datalog) ✅ 2024-08-09
	- [x] Earley parser ✅ 2024-08-09
	- [ ] % [GLR parser](http://www.springerlink.com/content/gdh7lun4rbv1w54m/)
- Single Static Assignment
	- [ ] [Paper](http://grothoff.org/christian/teaching/2007/3353/papers/ssa.pdf)
	- [x] [[ahoDragonBookGrammars2007|Dragon Book 5, 6.2.4: grammars & SSA]] ✅ 2024-07-30
	- [x] [[appelSSAFunctionalProgramming1998|SSA is functional programming]] ✅ 2024-07-30
- [[continuation-passing style|Continuation-passing style (CPS)]]
	- [x] How it's used in compiler intermediate languages ✅ 2024-07-26
		- [x] [The essence of compiling with continuations](https://dl.acm.org/doi/10.1145/155090.155113) ✅ 2024-07-26
		- [ ] % Andrew W. Appel, [Compiling with continuations](https://www.amazon.com/Compiling-Continuations-Andrew-W-Appel/dp/052103311X)
	- [x] Relationship between SSA and CPS ✅ 2024-07-25
		- [x] [[appelSSAFunctionalProgramming1998|SSA is functional programming]] ✅ 2024-07-25
- Attribute Grammars and Syntax-directed Translation
	- [x] [[ahoDragonBookGrammars2007|Dragon Book 5, 6.2.4: grammars & SSA]] ✅ 2024-07-18
- Control Flow Analysis, the Control Flow Graph, and its use in optimization
	- [x] [[ahoDragonBookBasic2007|Dragon Book 8.4: Basic blocks & control flow graphs]] ✅ 2024-07-18
	- [/] [[ahoDragonBookMachineindependent2007|Dragon Book 9: Machine-independent optimization]]
- Dependence Analysis & the Program Dependence Graph
	- [x] [[ferranteProgramDependenceGraph1987|The program dependence graph and its use in optimization]] ✅ 2024-08-03
	- [/] [[ahoDragon10112007#Synchronization between parallel loops|Dragon §11.8]]
- Polyhedral analysis its uses in locality optimizations and automatic parallelization
	- [/] [[ahoDragon10112007|Dragon Book 10, 11: Parallelism]] (§11.9)
- "Basic optimizations"
	- e.g. constant propagation, dead code elimination, global value numbering, loop invariant code motion, inlining
	- [x] Brief overview in [[ahoDragonBookMachineindependent2007#The principal sources of optimization|Dragon Book 2nd Ed, 9.1]] ✅ 2024-07-18
	- [x] See also [[2024-07-10 • optimizations and gc|program optimization]]
- Run-time optimizations (e.g. Java Hotspot)
	- [x] [[Java Implementation and HotSpot Optimizations]] ✅ 2024-07-24
	- [x] See also [[2024-07-10 • optimizations and gc|program optimization]]
- Garbage collection vs manual memory management    
	- [x] [[wilsonUniprocessorGarbageCollection1992|Uniprocessor garbage collection techniques]] ✅ 2024-07-23
	- [ ] % This [survey](ftp://ftp.cs.utexas.edu/pub/garbage/bigsurv.ps) covers a wide breadth of material.  
- Language tooling (and its implementation)
	- e.g., refactoring, syntax completion, code generators
	- [x] [[2024-04-11 • CS 294, 12Th – Projectional Editors]]
	- [ ] deprioritize
- FFI issues
	- e.g., incompatible memory management
- Automatic parallelization
	- [/] [[ahoDragon10112007|Dragon Book 10, 11: Parallelism]]

### Static analysis

- Data Flow Analysis
	- [ ] [paper](http://link.springer.com/article/10.1007%2FBF01237234)
	- [/] [[ahoDragonBookMachineindependent2007|Dragon Book 9: Machine-independent optimization]]
	- [ ] % and one of the [original papers](http://dl.acm.org/citation.cfm?id=512945).
- Abstract Interpretation
	- [x] [[nielsonPrinciplesProgramAnalysis1999b|Principles of Program Analysis 4: Abstract interpretation]] ✅ 2024-07-30
	- [ ] [Abstract Interpretation Based Formal Method and Future Challenges](http://www.di.ens.fr/~cousot/COUSOTpapers/publications.www/Cousot-LNCS2000-sv-sb.pdf)
	- [x] [An introduction to abstract interpretation](http://www.eecs.berkeley.edu/~necula/cs263/handouts/AbramskiAI.pdf) ✅ 2024-08-21
- Graph Reachability and CFG-Reachability
	- [ ] [[repsProgramAnalysisGraph1998|Program analysis via graph reachability]]
- Expression equivalence as in Value Numbering
	- [x] [[value numbering]]
- Type inference based analysis
	- [x] [[pierceTAPL20222002|TAPL §22: Type reconstruction]]
	- [x] [[semantic analysis]] ✅ 2024-08-22
- Alias analysis
	- [x] [[sridharanAliasAnalysisObjectOriented2013|Alias Analysis for Object-Oriented Programs]] ✅ 2024-07-29
		- See notes for additional resources/links
- Control-flow analysis (k-CFA). Tradeoffs between flow-(in)sensitive, path-(in)sensitive, and context-(in)sensitive analyses.
	- [x] [[nielsonPrinciplesProgramAnalysis1999a|Principles of Program Analysis 3: Constraint-based analysis]] ✅ 2024-07-27
		- See notes for additional resources/links

### Extra

- [ ] % [Gruene, Jacobs book on parsing](http://books.google.com/books?id=05xA_d5dSwAC), a veritable encyclopedia, but unlike the Dragon book it includes the last 30 years’ innovations (like GLR).  It also has the classics, including FSAs for lexing.
- [x] % [Abstract Interpretation in a Nutshell](http://www.di.ens.fr/~cousot/AI/IntroAbsInt.html) (incorporated into [[nielsonPrinciplesProgramAnalysis1999b|abstract interpretation]]) ✅ 2024-08-06
- [ ] % parallelizing compilers (eg kennedy and allen)

## Algorithmic verification, testing, and debugging

- [x] [[tipSurveyProgramSlicing1994|A survey of program slicing techniques]] ✅ 2024-08-05
	- [x] https://www.ssw.uni-linz.ac.at/General/Staff/CS/Research/Publications/Ste99a.html, chapter 3 (CS 294) ✅ 2024-08-05
	- [ ] % http://www.r-5.org/files/books/computers/compilers/writing/Keith_Cooper_Linda_Torczon-Engineering_a_Compiler-EN.pdf (in general)
- [/] [[henzingerLazyAbstraction2002|Lazy abstraction]]
	- [ ] Software model checking. Ranjit Jhala and Rupak Majumdar. ACM Comput. Surv. 41, 4, Article 21 (October 2009), 54 pages. http://doi.acm.org/10.1145/1592434.1592438
- [/] [[ocallahanHybridDynamicData2003|Hybrid dynamic data race detection]]
- [/] [[godefroidDARTDirectedAutomated2005|DART: directed automated random testing]]
	- [ ] % James C. King. 1976. Symbolic execution and program testing. Commun. ACM 19, 7 (July 1976), 385-394. DOI=10.1145/360248.360252 http://doi.acm.org/10.1145/360248.360252 (superceded? by dart)
	- [ ] % Leo suggests there is a recent OAKLAND survey/overview: [All You Ever Wanted to Know About Dynamic Taint Analysis and Forward Symbolic Execution](https://users.ece.cmu.edu/~aavgerin/papers/Oakland10.pdf).
- [/] [[SAT and SMT solving]]
	- [/] [[barrettSatisfiabilityModuloTheories2008|Satisﬁability Modulo Theories]]
	- [ ] % [[nieuwenhuisSolvingSATSAT2006|Solving SAT and SAT Modulo Theories]] (superceded by the above)
	- [ ] % Greg Nelson, Derek C. Oppen: Simplification by Cooperating Decision Procedures. ACM Trans. Program. Lang. Syst. 1(2): 245-257 (1979) (extra)
- [/] [[clarkeVerificationToolsFinitestate1994|Verification tools for finite-state concurrent systems]]
- [/] [[grafConstructionAbstractState1997|Construction of abstract state graphs with PVS]]

### Optional

- [ ] % C. Flanagan, K. R. M. Leino, M. Lillibridge, G. Nelson, J. B. Saxe, R. Stata Extended Static Checking for Java Proceedings of the ACM SIGPLAN 2002 Conference on Programming language design and implementation (PLDI 2002) Tool publicly available at [http://research.compaq.com/SRC/esc/](http://research.compaq.com/SRC/esc/)
- [ ] % S. Malik and L. Zhang, Boolean Satisfiability: From Theoretical Hardness to Practical Success, Communications of the ACM, vol. 52, no. 8, August 2009.
- [ ] % E.A. Lee and S. Seshia, Introduction to Embedded Systems, A Cyber-Physical Systems Approach, 2nd Edition. Chaps. 13 and 15. [http://LeeSeshia.org](http://leeseshia.org/).
- [ ] % Clarke, Grumberg, and Peled. Model Checking (MIT press). Chapters: 1. Introduction, 2. Modeling Systems, 3. Temporal Logics, and 4. Model Checking
- [ ] % Symbolic model checking: 10^20 States and beyond. J.R. Burch, E.M. Clarke, K.L. McMillan, D.L. Dill, L.J. Hwang, Information and Computation, Volume 98, Issue 2, June 1992, Pages 142-170, ISSN 0890-5401.[http://www.sciencedirect.com/science/article/B6WGK-4DX44C6-6T/2/fe89ddab72b8634621ce5d293f3a8660](http://www.sciencedirect.com/science/article/B6WGK-4DX44C6-6T/2/fe89ddab72b8634621ce5d293f3a8660)
- [ ] % A machine program for theorem-proving (DPLL paper). Martin Davis, George Logemann, and Donald Loveland. 1962. Commun. ACM 5, 7 (July 1962), 394-397. [http://doi.acm.org/10.1145/368273.368557](http://doi.acm.org/10.1145/368273.368557)
- [ ] % Chapters on constraint-solving based, and type/effect systems found in Nielson et al.’s Principles of Program Analysis [http://www.amazon.com/Principles-Program-Analysis-Flemming-Nielson/dp/3540654100](http://www.amazon.com/Principles-Program-Analysis-Flemming-Nielson/dp/3540654100)
- [ ] % Greg Nelson: Techniques for Program Verification.Ph.D. Thesis. 1980.
- [ ] % Randal E. Bryant. Graph-Based Algorithms for Boolean Function Manipulation, IEEE Transactions on Computers, Vol. C-35, No. 8, August, 1986, pp. 677-691
- [ ] % Manuvir Das, Sorin Lerner and Mark Seigle. ESP: Path-Sensitive Program Verification in Polynomial Time. PLDI 2002.
- [ ] % Something on abstraction (say one of the early SLAM/Blast papers or Graf-Saidi).
- [ ] % Static checking of assertions/annotations, maybe ESC/Java paper ([Extended static checking for Java](http://network.ku.edu.tr/~stasiran/ecoe560/Papers/krml103.pdf), Flanagan, et al., PLDI 2002)
- [ ] % Specification inference, invariant generation, eg [DAIKON](http://homes.cs.washington.edu/~mernst/pubs/invariants-icse99.pdf).

# Study seshes

## Mon: random with Justin

- [x] [[2024-08-12 • Justin, prelim grab bag]] 🔁 every week on Monday ⏳ 2024-08-12T12:30--13:30 ✅ 2024-08-12
- [x] [[2024-08-05 • Justin, prelim grab bag]] 🔁 every week on Monday ⏳ 2024-08-05T12:30--13:30 ✅ 2024-08-06
- [x] [[2024-07-29 • Justin, prelim grab bag]] 🔁 every week on Monday ⏳ 2024-07-29T12:30--13:30 ✅ 2024-07-29

## Wed: targeted with Justin

- [x] [[2024-08-14 • Justin, prelim targeted - auto-parallelization]] 🔁 every week on Wednesday ⏳ 2024-08-14T14:00--15:00 ✅ 2024-08-14
- [x] Prelim targeted sesh w/ Justin 🔁 every week on Wednesday ⏳ 2024-08-07T14:00--15:00 ✅ 2024-08-08
- [x] [[2024-07-31 • Justin, prelim targeted - abstract interpretation]] 🔁 every week on Wednesday ⏳ 2024-07-31T14:00--15:00 ✅ 2024-07-31

## Thu: Parker (one-off?)

- [x] [[2024-08-09 • Parker, prelim grab bag - axiomatic semantics]] ⏳ 2024-08-09T13:00 ✅ 2024-08-10

## Federico one-off

- [x] [[2024-08-21 • Federico, prelim grab bag]] ⏳ 2024-08-21T12:00--13:00 ✅ 2024-08-22

