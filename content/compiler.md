This note collects resources on the general compilation pipeline. In other words, **how does a compiler work**?

> [!note] See also
> This draws heavily from the [Stanford CS 143: Compilers](https://web.stanford.edu/class/archive/cs/cs143/cs143.1128/) course resources.

From [here](https://web.stanford.edu/class/archive/cs/cs143/cs143.1128/lectures/00/Slides00.pdf):

![[Screenshot 2024-08-21 at 6.23.59 PM.png]]

### The stages of compilation

- lexing
- [[parsing]]
- [[semantic analysis]]
- ir generation (see [[#Three address code (TAC)]])
- [[2024-07-10 • optimizations and gc|program optimization]] (ir optimization, output assembly/machine code optimization)
- [[register allocation|register allocation & code generation]]

# Three address code (TAC)

TAC is an lower-level IR. Generic assembly language in lower end of mid-level IRs.

```c
_t1 = b * c;
_t2 = b * d;
_t3 = _t1 + _t2;
a = _t3;
```
