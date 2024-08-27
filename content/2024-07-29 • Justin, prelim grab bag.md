# Questions

- Write the grammar for an imperative language with assignment and if *statements*.
 	- No need to define expressions
- Write the typing rules for this language, assuming that the types of all variables are stated somewhere before the program.
- Now, modify your typing rules such that variables take the type of the first expression they're applied to.
- Now, modify your typing rules such to work with the idiom where a variable can be defined in both branches of a conditional, and it is available after the conditional.

## Full board

![[256E6AF0-34C2-4219-9A69-AB3CE9784717_1_105_c.jpeg]]

# Notes

Along with talking through explanations and using examples, the main note has to do with notation. Here, I used function notation to check if a statement is well-typed. I did this because I was confused about notation; our typing judgments are no longer "this expression has this type":
$$
\Gamma \vdash e : T
$$
Instead, for imperative statements, we say: "Under $\Gamma$, program $p$ type-checks and produces new context $\Gamma'$":
$$
\Gamma \vdash p \dashv \Gamma'
$$

The other tip is to have a boilerplate "imperative language" grammar structure in my head before, so I can be ready to spit that out on command. Similar to having STLC in my head!
