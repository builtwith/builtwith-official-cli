# skills/

YAML files describing invariants and best-practice patterns for AI agents using the BuiltWith CLI.

| File | Purpose |
|------|---------|
| `general.yaml` | Universal invariants for all CLI invocations |
| `domain-lookup.yaml` | Domain-specific guidance and example patterns |
| `lists.yaml` | Pagination and rate-limit handling for `lists tech` |

To apply these in Claude Code, reference them in `.claude/CLAUDE.md`:
```
See skills/general.yaml for BuiltWith CLI invariants.
```
