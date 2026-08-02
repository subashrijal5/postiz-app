---
name: deploy
description: Cut and ship a new release of this postiz-app fork to production. Use this whenever the user asks to "deploy", "release", "ship this", "cut a release", "push a new version", "tag a release", or wants their recent changes live on the production Dokploy server — even if phrased casually, like "let's get this out" or "can we ship what's on main now". Walks through the full version-tag → CI build → Dokploy-redeploy pipeline this repo already has wired up, and always pauses for explicit confirmation right before the one irreversible step (pushing the tag), since that immediately triggers a real production deploy.
---

# Deploy

## How a release actually works in this repo

Nothing here is invented — this is the pipeline that's already running (`.github/workflows/build-containers.yml`):

1. A git tag matching `v*.*.*` gets pushed to `origin`.
2. That triggers the `build-containers` workflow: it builds multi-arch (amd64+arm64) Docker images for `frontend` and `server`, pushes them to `ghcr.io/subashrijal5/postiz-app-{frontend,server}` tagged with both the version string and `:latest`, and bakes the tag name in as `NEXT_PUBLIC_VERSION` (that's what shows up as the app version in the UI — not `package.json`).
3. Once the manifest step finishes, the workflow's `trigger-deploy` job fires the `DEPLOY_WEBHOOK_FRONTEND` / `_BACKEND` / `_ORCHESTRATOR` repo secrets — these are Dokploy webhooks that pull `:latest` and redeploy production. **This part is automatic and happens the moment the tag lands on GitHub** — there is no separate "deploy" click.

So the entire job of this skill is: get a well-chosen, well-described tag onto `origin` safely. Everything after that is already automated.

Two things in this repo are red herrings — don't touch them as part of a release:
- `package.json`'s `"version"` field is frozen at `"1.0.0"` on purpose; it's never bumped. Ignore it.
- `version.txt` at the repo root (`v1.47.0`) is dead leftover from the upstream project — nothing reads it. Ignore it.

## Steps

### 1. Run the preflight script

```bash
bash .claude/skills/deploy/scripts/preflight.sh
```

This is read-only — it never tags or pushes anything, so it's always safe to run, including just to check state. It reports: current branch, whether the working tree is clean, whether local `main` matches `origin/main`, the highest existing version tag with proposed patch/minor/major bumps, and a commit log to draft the release notes from.

### 2. Make sure it's safe to release from here

This project is in production with real users (see `CLAUDE.md`), so don't tag from just anywhere:

- **Must be on `main`.** If the preflight output shows a different branch, stop and tell the user what's on that branch and that it needs to be merged into `main` first — don't merge it yourself as a side effect of a deploy request, since "merge this branch" and "release" are separate decisions even if the user wants both.
- **Working tree must be clean.** If it's dirty, tell the user what's uncommitted and ask what to do with it (commit, stash, or ignore) rather than guessing.
- **Local `main` must match `origin/main`.** If it's out of sync, say so — behind means there are remote changes not yet pulled; ahead means there's local work not yet pushed. Either way, resolve that before tagging, since the tag needs to point at a commit that's actually on `origin`.

If all three check out, move on.

### 3. Propose the version and draft the release notes

Take the highest existing tag from the preflight output and propose the **patch** bump by default (that's the historical norm here — `v1.0.0` through `v1.0.8` are all patch increments). Mention the minor/major options too in case this release warrants one, but don't belabor it — most releases here are small.

For the message, look at the commit log since the nearest ancestor tag and write a short, human summary **in the style of the good historical tags** — e.g. `v1.0.8: cache-bust brand logo assets to fix stale logo after redeploy` or `v1.0.7: redesigned login page, removed testimonial panel, dark-mode logo fix`. Not `v1.0.0: sds`. A few things to watch for in that commit log:
- If it includes a big batch of upstream-sync or merge-commit noise (this happens whenever `main` recently pulled from `gitroomhq/postiz-app` upstream), don't enumerate every commit — call it out as one line ("includes upstream sync") and focus the rest of the message on what actually changed in this fork.
- If the nearest ancestor tag isn't actually an ancestor of `main` right now (this happened before — some tags were cut from side branches and never made it back), the "commits since" list may be much larger than what's actually new since the *last real release*. Use judgment about what's genuinely release-worthy versus already-shipped-elsewhere.

Show the user the proposed version and drafted message together and let them accept or edit either one.

### 4. Create the tag locally

```bash
git tag -a <version> -m "<message>"
```

This is local-only and harmless — nothing has shipped yet. If the user wants to reconsider, `git tag -d <version>` undoes it cleanly.

### 5. Stop and confirm before pushing — this is the real deploy trigger

Before running `git push`, show a clear summary and get explicit go-ahead:

> Tag `<version>` is ready, pointing at `<short sha>` on `main`: "`<message>`". Pushing this will kick off the build pipeline and **automatically redeploy production** via the Dokploy webhooks once it finishes. Push now?

Do not push without an explicit yes. This is the one step in the whole flow that can't be undone by deleting a local ref — once GitHub has the tag, the workflow runs.

### 6. Push

```bash
git push origin <version>
```

### 7. Report where to watch it

Point the user at the Actions run so they can follow along, and remind them what happens next automatically:

```bash
gh run list --repo subashrijal5/postiz-app --workflow=build-containers.yml --limit=1
```

**Always pass `--repo subashrijal5/postiz-app` explicitly to `gh` here.** This repo is a fork, and `gh` silently defaults unscoped commands to the upstream parent (`gitroomhq/postiz-app`) instead of the fork — without `--repo` you'll see (and report) someone else's workflow runs, not the one that just started.

Or just link `https://github.com/subashrijal5/postiz-app/actions/workflows/build-containers.yml`. Building both architectures for both images plus the manifest step takes a few minutes — the Dokploy webhooks fire only after that completes, so production won't update instantly.

### 8. Understand what "webhook succeeded" actually means — Dokploy deploys one at a time

The three `trigger-deploy` jobs (frontend/backend/orchestrator) fire almost simultaneously and each gets HTTP 200 with `{"message":"Application deployed successfully"}` from Dokploy. **That message means "queued", not "live."** Dokploy's deploy queue processes one job at a time server-wide — confirmed via `dokploy deployment queue-list --json`, which showed one job `active` and the other two sitting in `waiting` state even though all three webhooks had already returned success. If the user asks "did it actually deploy?" or "it looks like it wasn't triggered," don't just trust the GitHub Actions green checkmark — check Dokploy's actual queue and deployment state:

```bash
dokploy deployment queue-list --json          # anything still active/waiting right now
dokploy deployment all-centralized --json     # recent history across every resource, filter by timestamp
```

If the Dokploy MCP server is being used instead of the CLI and returns `Invalid URL` or similar, switch to the `dokploy` skill/CLI — see its own guidance on the GET-request 400 bug if `deployment all --applicationId <id>` 400s (needs the `apiGetFixed` workaround documented there). A single deploy in this project has taken up to ~12 minutes historically (orchestrator especially), so with three queued sequentially, expect the full rollout to take longer than any individual job's build time.
