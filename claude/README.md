# Claude Agent Configuration

AI guidance for the ZenVida WhatsApp automation project (Claude Code / Claude CLI).

## Structure

```
claude/
├── CLAUDE.md       # Main project instructions (mirrored to root)
├── rules/          # Focused rule files for reference
│   ├── project-context.md
│   ├── automation-stages.md
│   └── nestjs-patterns.md
└── skills/         # Task-specific workflows
    ├── implement-automation-stage/
    ├── whatsapp-messaging/
    └── add-integration/
```

## Setup

- **Claude Code** reads `CLAUDE.md` at the project root automatically.
- Skills in `claude/skills/` can be referenced with `@claude/skills/<name>/SKILL.md`.
- For `.claude/skills/` support, symlink: `ln -s ../claude/skills .claude/skills`

## Parity with Cursor

| Cursor                     | Claude                            |
| -------------------------- | --------------------------------- |
| `cursor/rules/*.mdc`       | `claude/rules/*.md` + `CLAUDE.md` |
| `cursor/skills/*/SKILL.md` | `claude/skills/*/SKILL.md`        |

Both directories contain equivalent content in their respective formats.

## Domain Reference

Full business requirements: [`overview.md`](../overview.md)
