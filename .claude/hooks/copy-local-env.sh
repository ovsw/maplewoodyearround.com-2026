#!/usr/bin/env bash
# WorktreeCreate hook: copy gitignored local env files from the main checkout
# into a newly created worktree, so `pnpm dev` works there immediately.
#
# Reads the hook payload on stdin and copies each file listed in FILES.
# Never returns hookSpecificOutput.worktreePath — this hook augments worktree
# creation, it does not replace it.

set -uo pipefail

FILES=(
  "frontend/.env.local"
  "studio/.env.local"
)

payload="$(cat)"

# The worktree path key has varied across versions; accept any of them.
dest="$(printf '%s' "$payload" | jq -r '
  .worktree_path // .worktreePath // .worktree.path //
  .hookSpecificOutput.worktreePath // empty
' 2>/dev/null)"

[ -n "$dest" ] && [ -d "$dest" ] || exit 0

# Main checkout = the worktree whose .git is a directory (not a gitdir file).
src="$(git -C "$dest" worktree list --porcelain 2>/dev/null \
  | awk '/^worktree /{print substr($0,10)}' \
  | while read -r wt; do [ -d "$wt/.git" ] && { printf '%s' "$wt"; break; }; done)"

[ -n "${src:-}" ] && [ "$src" != "$dest" ] || exit 0

copied=()
for rel in "${FILES[@]}"; do
  [ -f "$src/$rel" ] || continue
  [ -e "$dest/$rel" ] && continue          # never clobber an existing file
  mkdir -p "$dest/$(dirname "$rel")"
  # A failed copy is reported rather than swallowed: silently skipping it
  # leaves a worktree that looks set up but has no env, which surfaces much
  # later as a confusing runtime error.
  if cp "$src/$rel" "$dest/$rel" 2>/dev/null; then
    copied+=("$rel")
  else
    printf 'copy-local-env: failed to copy %s into worktree\n' "$rel" >&2
  fi
done

[ ${#copied[@]} -eq 0 ] && exit 0

printf '{"systemMessage":"Copied local env into worktree: %s"}\n' "$(IFS=', '; echo "${copied[*]}")"
