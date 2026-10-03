---
name: next-dev-loop
description: >
  Verify Next.js runtime behavior after editing app code. Use this
  skill to confirm a change works in a running app, beyond compiling
  or type-checking. Combines /_next/mcp with Codex's in-app Browser.
  Requires a running next dev.
disable-model-invocation: true
---

# next-dev-loop

Verify a Next.js change through two views of the running app:

- `/_next/mcp` reports routes, compilation issues, server errors, and
  framework metadata.
- Codex's in-app Browser reports what the visitor sees and can do.

Use the in-app Browser only. Never launch `agent-browser`, Chrome, Edge,
or another external browser. If the in-app Browser is unavailable, stop
and report that verification is blocked.

## Requirements

- Next.js 16.3 or newer with Turbopack.
- A running `next dev` server.
- The `browser:control-in-app-browser` skill.

Before browser work, read `browser:control-in-app-browser` completely and
follow its current setup instructions. Select the `iab` browser explicitly.
Do not use a default browser selector or URL-based browser selection.

## Preflight

Run this once per session.

1. Read the port from the `next dev` banner. Check that the target URL
   belongs to that server.
2. Initialize the Browser runtime as directed by
   `browser:control-in-app-browser`, select `iab`, read its complete
   documentation, and open the target URL in an in-app tab.
3. Call `tools/list` on `http://localhost:<port>/_next/mcp` and confirm it
   includes `get_compilation_issues`.
4. Call `get_compilation_issues`.
   - An unreachable endpoint means `next dev` is not running or Next.js is
     older than 16.3. Check `package.json` and report the exact blocker.
   - `Turbopack project is not available` means the dev server uses webpack.
     Stop and report that Turbopack is required.
5. Call `get_routes` and keep the route map for the verification loop.

## Before editing

Use `get_page_metadata` on the rendered target route to identify the files
that contribute to it. Use those files as the initial search scope.

## After editing

Check each failure mode:

1. **Compiles.** Call `get_compilation_issues`.
2. **Runs without errors.** Navigate to the exact route in the in-app Browser,
   then call `get_errors`.
3. **Behaves correctly.** Use the in-app Browser to exercise the visitor flow
   and inspect the rendered DOM.
4. **Looks correct.** Inspect the exact component, state, and required desktop
   and mobile viewports in the in-app Browser. Capture a screenshot when it
   helps the user review the result.

Use the in-app Browser documentation to choose navigation, interaction, DOM,
console, network, screenshot, and viewport operations. Do not guess its API.

The in-app Browser does not guarantee React fiber, hook, or render-count
inspection. If the task specifically requires that evidence, report the gap.
Do not open an external browser to fill it.

## Reconcile disagreements

When the Browser and `/_next/mcp` disagree, verify:

- the in-app tab points at the current dev server and exact route;
- the requested viewport and state are active;
- the route finished navigating;
- the dev server compiled the latest files.

Recheck both views before blaming the app.

## Next MCP notes

- `get_errors` and `get_page_metadata` need at least one browser navigation.
- `/_next/mcp` replies use server-sent events. Parse the JSON from the `data:`
  line.
- Call `tools/list` rather than assuming the available tool set.

Expected tools:

```text
get_project_metadata
get_routes
get_errors
get_page_metadata
get_logs
get_server_action_by_id
get_compilation_issues
```

## Finish

Leave the user's existing in-app tabs alone. Close only a tab created solely
for this verification when cleanup is useful. Keep `next dev` running for the
next loop unless the current task started it and no longer needs it.

`next-dev-loop-<topic>` sibling skills assume this preflight has already run.
