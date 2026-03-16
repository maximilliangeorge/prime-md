# Tractatus Logico-Philosophicus

Wittgenstein's *Tractatus Logico-Philosophicus* (1921) encoded as a Prime argument graph. The book's 526 numbered propositions are distilled into 16 nodes that trace the central argument: from the ontology of facts and objects, through the picture theory of meaning and the saying/showing distinction, to the self-undermining conclusion that the book's own propositions are senseless — and that one must be silent.

## Structure

The graph has 16 nodes forming a DAG with `silence.md` (proposition 7) as the root conclusion:

- **Axioms** (no premises): `world-is-facts.md` (1), `objects-are-simple.md` (2.02), `logical-form.md` (2.18)
- **Ontology**: `atomic-facts.md` (2)
- **Picture theory**: `pictures.md` (2.1) -> `thought.md` (3) -> `propositions.md` (4)
- **Truth-functions**: `elementary-propositions.md` (4.21) -> `truth-functions.md` (5) -> `general-form.md` (6)
- **Limits**: `saying-and-showing.md` (4.1212) + `general-form.md` -> `limits-of-language.md` (5.6)
- **Ethics & the mystical**: `ethics-is-transcendental.md` (6.421) -> `the-mystical.md` (6.44)
- **Self-undermining**: `the-ladder.md` (6.54) -> `silence.md` (7)

## Argument map

```
world-is-facts ──┐
                  ├─→ atomic-facts ──┬─→ pictures ──→ thought ──→ propositions ──┬─→ elem-props ──→ truth-funcs ──→ general-form ──┐
objects-simple ───┘                  │                                            │                      │                          │
                                     │                                            │                      │                          │
logical-form ────────────────────────┘                     ┌──────────────────────┘                      │                          │
                                                           │                                             │                          │
                                                           ├─→ saying-and-showing ──────────┬────────────┼──────────────────────────┤
                                                           │                                │            │                          │
                                                           │               limits-of-language ◄───────────┘──────────────────────────┘
                                                           │                    │         │
                                                           │                    │         └──→ ethics ──→ mystical ──┐
                                                           │                    │                                    │
                                                           └────────────────────┤──→ ladder ◄───────────────────────┘
                                                                                │       │
                                                                                └──→ silence ◄──┘
```

## The numbering system

Wittgenstein's decimal notation is itself a DAG: proposition *n.m* is a remark on *n*. The seven main propositions (1–7) form the spine; sub-propositions elaborate. This example extracts the load-bearing argument, preserving Tractatus numbers in parentheses so each node can be traced back to the source text.

## Usage

```sh
# Validate the argument graph
npx prime-md validate .

# View as a tree
npx prime-md graph . -f tree

# Export as DOT for visualization
npx prime-md graph . -f dot
```

## Exports

`prime.yaml` exports `silence.md`, making it available as a premise for other repositories via `prime://` URIs.
