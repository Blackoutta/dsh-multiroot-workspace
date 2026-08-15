# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [0.1.0-rc.1] - 2026-08-15

### Added

- Logical Workspaces with multiple named filesystem roots, one selected primary root, and stock grouped/flat Session views.
- `ws_list`, `ws_cd`, `ws_read`, `ws_write`, `ws_edit`, `ws_glob`, `ws_grep`, and policy-controlled `ws_bash` tools.
- Plugin-owned per-Session current-root durability, canonical root confinement, storage purge, and adopted-versus-owned shadow handling.
- Self-contained deterministic browser client, packed-profile/tool smoke tests, and a full light/dark browser acceptance matrix.

### Compatibility

- Supports DeepSeek Harness `0.1.0-rc.6` on macOS and Linux.
- Windows is not supported in this prerelease because filesystem search, shell execution, and common-ancestor fencing follow POSIX behavior.
