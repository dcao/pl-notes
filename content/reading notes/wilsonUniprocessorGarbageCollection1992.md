---
aliases:
  - "Uniprocessor garbage collection techniques"
tags:
  - reading
year: 1992
authors:
  - Wilson, Paul R.
editors:
  - Bekkers, Yves
  - Cohen, Jacques    
status: Todo 
related:  
itemType: conferencePaper  
location: Berlin, Heidelberg   
pages: 1-42  
DOI: 10.1007/BFb0017182  
ISBN: 978-3-540-47315-2
scheduled: 2024-07-18
---
# Automatic storage reclamation: about GC

Garbage collection is reclaiming memory that isn't reachable through pointer traversals. We preserve *live* objects, and free garbage ones. Broadly, GC involves two steps:

1. **Garbage detection**: figure out what's live and what's not.
2. **Reclaiming** garbage objects' storage.

In [[ahoDragonBookMachineindependent2007|dataflow analysis]], we might perform a detailed liveness analysis to determine which values can never be used again based on a CFG. Garbage collectors are more conservative, using a *root set*—all global variables, local variables in activation stack, and registers used by active procedures—and *reachability* from this root set—all objects pointer reachable from the roots.

Before we proceed, let's clarify: how do languages determine the type of an object?

- For statically-typed languages, objects include a field containing type info
- For dynamically-typed languages, pointers are *tagged*—part of the pointer is used to denote type info

# Basic GC techniques

## Reference counting

`Rc<T>`. Every object has a counter with number of pointers to it. When a reference is created, this is incremented. If a reference is eliminated, it's decremented. We reclaim memory when the count reaches 0.

Note that when an object is reclaimed, we decrement reference counts of everything it references.

In this scheme, detection and reclamation are interleaved with execution. This is an *incremental* strategy—it doesn't perform that much work, and interleaves it with execution rather than stopping the world. Thus, it's good for *real-time* applications where we don't want big GC pauses.

However, this strategy has two main drawbacks.

- It **can't reclaim cyclic pointers**. Let's say objects `a` and `b` point to each other cyclically, and a variable initially points to `a`. If the variable stops pointing to `a`, `a` and `b` will never be freed, since they will always have a reference—each other—even if there's no path to them from the root set.
- **It can be inefficient**. Whenever a pointer is created or destroyed, the referent's count has to change. If a variable's value changes from one pointer to another, two reference counting operations must happen. For short-lived stack variables—e.g., passing an object pointer as an argument to a function—this can cause lots of spurious "increment then immediately decrement reference count" operations.

We can mitigate the last drawback by only accounting for pointers between heap objects for pointers, not for pointers on the stack. Then, to reclaim garbage, we do a quick scan of our stack objects to see if they reference heap objects, since our reference counts no longer record this. This **deferred reference counting** reduces overhead.

However, one other drawback is that reclaiming the object requires non-trivial bookkeeping—e.g., linking the freed objects into a "free list" of reusable objects. Overall, this time cost is proportional to number of objects allocated by the program.

## Mark-sweep collection

A much stricter divide between detection and reclamation:

- Perform **tracing**—starting at root set and traversing graph of pointer relationships—to determine live objects. These objects are **marked** in some sort of state, either in the object itself or in a separate state struct.
- Reclaim the garbage. Memory is **swept**—exhaustively examined—to find garbage objects and reclaimed, normally by linking them to free lists.

This has three major problems:

- **Fragmentation**: how do we handle objects of different sizes? Garbage objects are interspersed in memory with live ones, so finding space to allocate large objects is difficult. We can have separate free lists for different sizes, and we can merge adjacent free spaces, but it's still difficult!
	- In general, the system chooses between allocating more memory to create small data objects, or dividing contiguous chunks of free memory and risk permanently fragmenting them.
- **Efficiency**: GC cost is proportional to total (live + garbage) heap size (i.e., # of bytes allocated). Plus several passes over the data are required!
- **Locality**: objects of different ages are interleaved in memory, since objects are never moved. Not good for locality of reference!

## Mark-compact collection

We have a mark phase, but instead of sweeping, we do **compacting**: we slide down free objects until they're all contiguous. We eliminate fragmentation problems, and locality is improved, since normally storing objects in allocation order is better than arbitrary GC order.

Freeing is implicit here—garbage objects' memory is simply overwritten.

However, this requires several passes: compute new locations for objects, update pointers to new locations, actually move objects.

One compacting algorithm is a *two-pointer algorithm*: one pointer starts at the top of the heap looking for live objects, while one pointer starts at the bottom looking for holes to put it in.

## Copying GC

Like mark-compact, we move live objects to a contiguous area. However, instead of having a separate mark phase, we move objects as we traverse them.

Importantly, work is proportional only to the amount of live data. Also known as *scavenging*—we're picking out live objects amidst garbage, and taking them away.

### Stop-and-copy with semispaces

A common copying GC is the *semispace* collector using the *Cheney* algorithm for copying traversal.

In this scheme, we divide the heap into two contiguous semispaces, with one marked as "current." We allocate into the current semispace linearly, like a stack. When we run out of memory, we stop the world and perform GC. We traverse objects, and anything live is copied into the other semispace. We then switch to using the other semispace as "current."

One simple form of copying traversal is the Cheney algorithm. Start with an empty queue; this will become the new semispace (it's also called *tospace*). Add all the immediately reachable objects to this queue. Move a pointer through this queue; whenever we encounter a pointer to the old semispace (*fromspace*), add it to the end of the queue and update its pointer to point to its queue location. Continue until the pointer reaches the end of the queue. This is a breadth-first traversal of the objects, and now, the queue has become the new current semispace! ^3yhze8

To not copy objects multiple times when it's pointed to from multiple places, we replace the old object with a *forwarding pointer* upon first copy, which points to the new location of the object, denoting it's already been copied.

Since GC work is only proportional to size of live data, assuming the amount of live data stays constant during a program's runtime, we can decrease GC time by just decreasing GC frequency, i.e., increasing GC size!

## Non-copying implicit collection

This scheme takes some vibes from copying GC, but with non-copying collection. We use two doubly-linked lists free lists of memory. We allocate into the first list. When we run out, we traverse live objects and move them to the other linked list.

To do this, each object has two pointer fields and a "color" field, which indicates which list the object is contained in.

Once we've traversed, we know the old list is just garbage.

## Choosing the right GC

There are three cost components: initial work at each collection (e.g., root set scanning), work done per unit of allocation (e.g., bytes, # of objects), and work done during GC (e.g., tracing). For the most part, efficiency is about the same across strats: maybe copying GCs only need to cover 10% of memory (live objects only), but copying might be 10x slower than sweeping.

Lots of systems use hybrid techniques—e.g., using copying, but having a separate *large object area* and doing marking traversal there.

Non-copying GC can be conservative with respect to data that *might* be pointers. For example, in C, an integer could be either a pointer or just a number; copying GC might clobber this value if it's an integer!

## Problems with a simple GC

Copying GC has excellent asymptotic complexity—copying cost approaches 0 as memory becomes very large. Other collectors can be similarly efficient if memory reclamation and reallocation are small enough; garbage detection becomes major cost.

In practice, it's hard to get high efficiency though, since having lots of memory is expensive! If using virtual memory, poor locality of GC schemas can cause lots of paging (i.e., swapping to disk). All GC have this tradeoff—postponing GC makes GC work done less often, at the cost of requiring more space, leaving garbage (that wastes space) around longer, and potentially incurring time deficit there.

The main locality issue is that by the time space is reclaimed and reused, it's been paged out since other pages have been allocated in between. Compaction doesn't actually help that much—mark-sweep outperforms copy collection in practice since copy collection uses more memory.

Stop-the-world is also not great. GC pauses boooo.

# Incremental tracing collectors

These are all stop-the-world collectors. What if we want lower latency?

Incremental GC interleaves tracing collection with program execution. The main challenge here is that the program—referred to as the *mutator* in this context—can mutate program context *during* GC. Incremental GC has to be able to track changes to graph of reachable objects, recomputing its traversal in the face of these changes.

## Tricolor marking

We can think of tracing GC as traversing the graph of reachable objects and coloring them—white for garbage, black for live.

Since an incremental GC doesn't want the program changing things behind its back, we want to track an intermediate state—**gray**, from when an object has been reached by the traversal, but its descendants might not have been. In a copying collector, this is everything between the scan pointer and the end of the semispace (i.e., the free pointer). In a mark-sweep collector, the gray objects correspond to the stack or queue of objects used to control traversal. Anything that hasn't been reached yet is white.

No black objects point to white objects—they should only ever point to black or gray ones. The GC should be able to assume that it is "finished with" black objects and doesn't need to scan them again. For instance, if GC sees object $A$ and finishes scanning it, but $A$ then starts pointing to $C$, $C$ might never be traversed!

So how can we coordinate the collector and mutator?

- **Read barriers**: if a mutator tries to access a pointer to a white object, it immediately becomes gray. Since the mutator can never read a white object, it can never write pointers to them in a black object.
- **Write barriers**: we record writing a pointer into any object. Problematic behavior occurs only when the mutator writes a pointer from black to white object *and* destroys the original pointer to the white object before the collector sees it. The two write barrier ways guard against different parts of this condition.
	- **Snapshot-at-beginning**: stop the second condition by saving pointers. No paths to white objects can be broken without providing another to the GC.
	- **Incremental update**: stop the first condition by changing the color of the new referent to gray.

## Baker's incremental copying

This scheme builds on a [[wilsonUniprocessorGarbageCollection1992#^3yhze8|Cheney copying GC]], but with a few changes to allow for incremental copying (i.e., not stopping the world—what's termed *background scavenging* in this context):

- First, new objects are allocated in the new current semispace and thus always marked black.
- Whenever an object is allocated, an increment of scanning and copying is done, in order to find and copy live data to tospace before fromspace is exhausted.
	- Rate of copy collector work is tied to rate of allocation.
- We use a **read barrier**: the mutator is never allowed to see pointers into fromspace (i.e., into white objects); whenever we read a pointer, we see if it's in fromspace, and if it is, we copy it into tospace and mark it gray.
	- This is two-way communication. The mutator informs collector of changes by mutator to ensure objects aren't lost, and shields mutator from viewing temporary inconsistensies created by collector! Otherwise, mutator might see two versions of same object, one garbage and one copied.
	- This is expensive—tens of percent of overhead

## Baker's treadmill

Broadly, this strategy tries to replicate the core efficiency benefit of copying GC—implicit freeing—without actually copying, which limits other aspects of language implementation (see the discussion with C and stuff above).

All of our memory is allocated in the form of a cyclic doubly-linked list:

![[Screenshot 2024-07-23 at 12.39.59 PM.png]]

This list is divided into four parts using pointers into this list. The *new* segment is where new objects created during GC are allocated, where they're immediately marked black. The *free* segment, contiguous with the new segment, is unused space, marked white. The *from* segment holds objects allocated before GC. As objects are traversed, they're snapped to the *to* section, which contains both black and gray objects.

By the end of this process, all black objects are in either *new* or *to*. This becomes the new *from*. Then, *new* starts at the clockwise-most end of *from*. The old *from* is now all *free*.

This scheme is conservative in a few ways:

- We assume all new objects are live
- A gray object is considered live until the next GC cycle
	- However, if a gray object points to a white object $A$, and this pointer is overwritten during GC, and nothing else points to $A$, $A$ will be freed!

## Snapshot-at-beginning write-barrier algorithms

We don't need a read barrier for non-copying collectors! Yuasa's algorithm saves overwritten pointers to a marking stack, ensuring all objects live when GC starts are reached. However, this means *no* objects are freed during collection.

## Incremental update write-barrier algorithms

Dijkstra's algorithm is the most well-known here. Instead of retaining everything live at the beginning's of GC, it heuristically tries to retain everything live at the *end* of GC. How?

Now, we record when a pointer is installed in a marked-black object—checking the *destination* of the write, the black object, instead of the *source* of the write, the overwritten pointer—we effectively mark it as gray to scan it again.

Similar to Baker, if a pre-existing object becomes garbage before it's marked, it's freed. However, unlike both Baker and Yuasa, it's less conservative in how it treats objects allocated during GC. The others mark new objects as black, but Dijkstra marks them as white. At some point, the stack must be traversed and the objects reachable *at that time* are preserved.

This provides space benefit—immediately reclaiming short-lived objects, which are more common—at computational cost—assuming all new objects are live means traversal and collection time.

## Choosing incremental techniques

Write barriers are more easily made efficient without specialized hardware. Incremental update seems generally more effective—choosing root traversal ordering to avoid having collector's work be undone by mutator changes helps minimize cost of traversing newly-allocated live objects.

# Generational garbage collection

In most programs, **most objects live very briefly, while a small percent live much longer**. ==80-98% of newly-allocated objects die within a few million instructions==, or before 1 MB is allocated—most die even sooner, within tens of KB of allocation. Basically, objects either die immediately or never. For old objects, simple collectors repeatedly copy them back and forth—inefficient!

> [!note] Why talk about efficiency in terms of memory allocated, not wall clock time?
> GC time, and time between GCs, mostly depends on memory available. Additionally, wall clock time can vary with hardware.

**Generational collection** separates objects into multiple areas by age, scavenging older areas less than younger ones, and *advancing* younger objects into older areas when appropriate.

## Multiple subheaps with varying scavenge frequencies

Here's an example generational copying scheme: we divide memory into two semispaces for objects of different ages—*generations*—each with two semispaces for facilitating copying GC. If an object is live for long enough, we copy it to the other generation's semispace.

## Detecting intergenerational references

We need to be able to scavenge new generations without scavenging older ones. However, if an old object points to a new one, we still need to go through the old object and update its pointer! There are a few techniques for dealing with this:

- Maybe old objects have to point to an indirection table, used as part of the root set, which then points to an object in new space
	- Overhead!
- Maybe we add a kind of write barrier, *recording pointers* that point from old to new.

These are *conservative* estimates: pointers from old to new are seen as roots, even if these roots aren't necessarily live. An object in old memory might be dead!

Theoretically, we could also track new-to-old pointers so that we could independently collect old objects; but there are way more new-to-old pointers, since typically objects are created by referring to old ones. Inefficient!

We could also treat everything in the new semispace as a root set when collecting the old generation; scanning is faster than copying!

Generally, recording intergenerational pointers costs proportional to rate of program execution, not object creation.

There are still a bunch of important axes along which to make design decisions:

1. **Advancement policy**: how long before an object is "old?"
2. **Heap organization**: how to divide storage space between and within generations? How do we do this to be friendly to virtual memory and cache locality?
3. **Traversal algorithms**: for tracing, how to trace? And for copying, how to reorder objects when copied?
4. **Collection scheduling**: for non-incremental collection, how to mitigate pauses? Can we do "opportunistic" scheduling? Can we do adapt this to incremental schemes?
5. **Intergenerational references**: what's the best way to do this?