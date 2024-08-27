---
aliases:
  - "Construction of abstract state graphs with PVS"
tags:
  - reading
year: 1997
serieseditors:
  - Goos, Gerhard
  - Hartmanis, Juris
  - Leeuwen, Jan
editors:
  - Grumberg, Orna
authors:
  - Graf, Susanne
  - Saidi, Hassen    
status: Todo
source: http://link.springer.com/10.1007/3-540-63166-6_10 
related:  
itemType: bookSection  
volume: 1254  
publisher: Springer Berlin Heidelberg  
location: Berlin, Heidelberg   
pages: 72-83  
ISBN: 978-3-540-63166-8 978-3-540-69195-2
scheduled: 2024-08-26
---
> [!note]
> These notes are based on a [summary](https://slideplayer.com/slide/9017602/) of the paper I found online!

How can we construct a **state graph** for use with model checking in cases where systems have *infinite state space*?

This paper proposes a method **based on abstract interpretation**. Specifically, this paper was the first to propose the predicate-based representation used later by [[henzingerLazyAbstraction2002|Lazy abstraction]]: representing sets of program states in terms of *state predicates* that are true at that point!

> [!danger] TODO
> There's a lot more here. I'm tired. I haven't gone through it.