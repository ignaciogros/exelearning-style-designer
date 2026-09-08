---
name: review-style
description: Review the eXeLearning style in theme/ against the exports in contents/ — responsive behaviour, WCAG accessibility at a level chosen each run, dead code, CSS/JS errors, typography coverage, and the third-party credits in config.xml. Applies the corrections to theme/config.xml, theme/style.css and theme/style.js. Use when asked to review, audit, check or validate a style, or before downloading/shipping one.
---

# Pointer only — the skill itself lives in `.agents/`

This file exists **solely so Claude Code discovers the skill**. It holds no instructions of
its own. Verified on Claude Code 2.1.263: skills are discovered under `.claude/skills/` and
not under `.agents/skills/`, so this stub bridges the gap while the real content stays in a
vendor-neutral location (`CLAUDE.md` explains why).

**Read `.agents/skills/review-style/SKILL.md` now and follow it.** That file is the skill.

⚠️ **Its relative paths resolve from `.agents/skills/review-style/`, not from here.** When it
says `references/checks.md` it means `.agents/skills/review-style/references/checks.md`, and
`assets/a11y-probe.js` means `.agents/skills/review-style/assets/a11y-probe.js`.

## Do not "fix" this by moving files

Keeping the real skill under `.claude/` was considered and rejected: the knowledge in those
files is about eXeLearning, not about any one assistant, and a contributor using a different
tool has to be able to find it. Copying the content into this file instead would create two
sources of truth that drift. If a future version of Claude Code reads `.agents/skills/`, the
fix is to delete this stub — nothing else.
