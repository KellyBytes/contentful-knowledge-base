# Topic ownership

Which article owns each cross-cutting concept. Anything not listed here has no
overlap yet. Add a row when a second article needs to touch a concept an
existing article already covers.

| Concept                                | Owner                                            | Mentioned by                    |
| -------------------------------------- | ------------------------------------------------ | ------------------------------- |
| `var` loop trap / captured bindings    | `javascript/closures-explained`                  | `javascript/var-let-const`      |
| Temporal dead zone                     | `javascript/var-let-const`                       | —                               |
| `const` is not immutability            | `javascript/var-let-const`                       | —                               |
| Stale closure in an effect             | `javascript/closures-explained`                  | `react/useeffect-cleanup`       |
| The updater form `setX(x => …)`        | `react/state-as-a-snapshot`                      | `javascript/closures-explained` |
| Mutating state instead of replacing it | `javascript/array-methods-and-immutable-updates` | `react/state-as-a-snapshot`     |

Rules for using this file:

- Before drafting, check whether the concept already has an owner.
- If it does, cover it briefly and link to the owner.
- If the new article has the better claim to ownership, propose the swap and stop.
  Do not rewrite the existing article without being asked.
