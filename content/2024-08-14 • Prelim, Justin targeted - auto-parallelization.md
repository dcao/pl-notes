# Questions

- Given a program dependence graph (see the board), schedule these tasks optimally given two CPU cores.
- Do the same, but with three CPU cores.
- Given a general PDG and a number of CPU cores, how could we calculate the minimum number of time steps needed to execute the PDG?
- Now, let's say each task $T$ is made up of two subtasks, $T_{1}$ and $T_{2}$.
	- $T_{1} \to T_{2}$, and if $A \to B$, this means $A_{1} \to B_{1}$ and $A_{2} \to B_{2}$.
	- Schedule these tasks optimally for two CPU cores.
- Now, given the following for loop (see the board)
	- What are the different ways we could schedule this loop to run in parallel?
	- What are their (dis)advantages?

# Board

![[193E4F2A-A61D-4F5F-B324-485C8C419C67_1_102_o.jpeg]]