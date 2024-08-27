---
aliases:
  - "Algorithm = logic + control"
tags:
  - reading
year: 1979
authors:
  - Kowalski, Robert    
status: Todo
source: https://dl.acm.org/doi/10.1145/359131.359136 
related:  
itemType: journalArticle  
journal: "Commun. ACM"  
volume: 22  
issue: 7   
pages: 424–436  
DOI: 10.1145/359131.359136
scheduled: 2024-08-26
---
> We have argued that conventional algorithms can usefully be regarded as consisting of two components:
> 
> 1. a logic component which specifies what is to be done and
> 2. a control component which determines how it is to be done.
>    
> The efficiency of an algorithm can often be improved by improving the efficiency of the control component without changing the logic and therefore without changing the meaning of the algorithm.
> 
> The same algorithm can often be formulated in different ways. One formulation might incorporate a clear statement, in the logic component, of the knowledge to be used in solving the problem and achieve efficiency by employing sophisticated problem-solving strategies in the control component. Another formulation might produce the same behavior by complicating the logic component and employing a simple problem-solving strategy.
> 
> Although the trend in databases is towards the separation of logic and control, programming languages today do not distinguish between them. The programmer specifies both logic and control in a single language while the execution mechanism exercises only the most rudimentary problem-solving capabilities. Computer programs will be more often correct, more easily improved, and more readily adapted to new problems when programming languages separate logic and control, and when execution mechanisms provide more powerful problem-solving facilities of the kind provided by intelligent theorem-proving systems.

Basically arguing for [[Datalog]]-style: separate logic of function with impl detail.