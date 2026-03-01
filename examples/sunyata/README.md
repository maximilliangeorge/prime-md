# Śūnyatā

Nāgārjuna's Mādhyamaka argument for emptiness (*śūnyatā*) encoded as a Prime argument graph. Starting from dependent origination and the analysis of intrinsic nature, the argument establishes that all phenomena — including emptiness itself — are empty of svabhāva.

## Structure

The graph has 11 nodes forming a DAG with `sunyata.md` as the root conclusion:

- **Axioms** (no premises): `dependent-origination.md`, `no-independent-cause.md`, `identity-requires-essence.md`, `change-is-observed.md`, `relation-requires-terms.md`
- **Derived claims**: `nothing-self-caused.md` → `no-svabhava.md` → `emptiness-of-phenomena.md` → `sunyata.md`
- **Anti-nihilism**: `emptiness-not-nihilism.md` feeds into the final conclusion
- **Self-application**: `emptiness-of-emptiness.md` prevents reification

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

`prime.yaml` exports `sunyata.md`, making it available as a premise for other repositories via `prime://` URIs.
