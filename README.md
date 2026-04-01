# agent

`agent` is a meta-repository for building a strong default `AGENT.md` and `.github/copilot-instructions.md` baseline that can be copied into new repositories.

The goal is simple: stop re-explaining the same engineering preferences, workflow rules, architecture expectations, and AI assistant constraints in every new project.

## What This Repo Is For

- maintain a reusable, high-signal `AGENT.md`
- maintain a reusable, high-signal GitHub Copilot instructions file
- refine those files from real project experience instead of writing generic AI policy boilerplate
- keep `README.md` product-facing and keep agent guidance in dedicated instruction files

## Initial Source Material

This first version was informed by:

- [`trans-station`](../trans-station) and its repository-aware [`AGENTS.md`](../trans-station/AGENTS.md)
- [`webconsole`](../../bouvet/webconsole) and its product-facing `README.md`, AI docs, and [`.github/copilot-instructions.md`](../../bouvet/webconsole/.github/copilot-instructions.md)

The main patterns worth preserving were:

- `README.md` should explain the project, not duplicate internal coding rules
- `AGENT.md` should contain the deeper operating model, repo structure, conventions, and constraints
- `.github/copilot-instructions.md` should stay shorter, stricter, and focused on the rules that must always be loaded into Copilot context

## Files In This Repo

- [`AGENT.md`](/home/shimshon.zacken/Documents/projects/agent/AGENT.md): reusable long-form instructions for coding agents
- [`.github/copilot-instructions.md`](/home/shimshon.zacken/Documents/projects/agent/.github/copilot-instructions.md): concise always-on Copilot guidance

## How To Use These Files

Copy these files into a real repository as starting points, then adapt them to that repository.

For [`AGENT.md`](/home/shimshon.zacken/Documents/projects/agent/AGENT.md):

- rewrite the `Purpose` section first so it describes the actual product and current codebase reality
- add the real package manager, core commands, stack, and directory structure
- add only constraints that are enforceable in that repository
- document real pitfalls and legacy traps instead of generic warnings
- remove sections that do not help an agent produce better changes there

For [`.github/copilot-instructions.md`](/home/shimshon.zacken/Documents/projects/agent/.github/copilot-instructions.md):

- keep it short and stricter than `AGENT.md`
- keep only the rules that should apply in almost every Copilot response
- move longer explanations and deeper workflow guidance into `AGENT.md`
- make it read like native instructions for the target project, not like template-repo metadata

## Working Principles

- prefer portable rules over stack-specific noise
- encode durable engineering behavior, not one-off preferences
- keep instructions opinionated enough to shape good output
- avoid turning instruction files into bloated style guides no model will follow consistently
- split concerns clearly between product docs and agent docs

## Next Steps

- evolve the templates as more repositories expose missing rules
- add optional variants by stack, such as React, Node, or Python
- keep the default versions short enough that they remain useful in practice
