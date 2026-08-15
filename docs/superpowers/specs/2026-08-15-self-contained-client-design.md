# Self-Contained Client Design

**Date:** 2026-08-15

**Status:** Approved

## Context

`dsh-multiroot-workspace` must build, test, and pack without a sibling
DeepSeek Harness checkout. The supported Host release is
`@deepseek-ai/dsh@0.1.0-rc.6`.

The rc.6 client packages cannot serve as standalone test/build inputs:

- several packages declare `./src/*` exports but do not publish `src/`;
- browser entries use the DSH `window.__ModuleLoader__` handoff rather than
  ordinary ESM exports; and
- the published UI primitives replace CSS modules with empty maps, so
  components such as `Menu` lose their class names and styles.

The DeepSeek Harness repository is read-only reference material. This project
must not modify, commit to, or publish packages from that repository.

The reference plugin
[`dsh-context`](https://github.com/bowenliang123/dsh-context) demonstrates the
portable boundary we will adopt: ship a self-contained browser artifact,
externalize only Host platform modules, own the plugin CSS, and test the final
ModuleLoader bundle directly.

## Decision

Make the browser half self-contained while keeping the Host half integrated
through supported DSH services.

### Browser boundary

The generated `client.js` will contain all plugin-owned client code, including
the exact UI primitives, icons, store helper, and styles used by the copied
Workspace UI. Only React and ReactDOM remain Host-provided runtime modules.

The plugin will stop importing browser runtime values from:

- `@deepseek-ai/dsh-client-ui-primitives`;
- `@deepseek-ai/dsh-client-runtime/client`; and
- other DSH client packages whose published rc.6 artifacts are not standalone
  ESM inputs.

Type-only dependencies will be replaced by narrow local contracts when those
contracts are part of the plugin boundary. Runtime service access continues
through the injected client context.

### Vendored surface

Copy only code that the plugin actually executes:

- the UI primitives and icons referenced by the local Workspace fork;
- the minimal observable/store helper required by its state adapters; and
- the corresponding CSS modules.

Vendored files live under `src/client/vendor/` and retain their upstream
copyright and license notices. `UPSTREAM.md` records the source repository,
commit, copied paths, and intentional deviations. No unused primitive library,
Markdown renderer, syntax highlighter, or speculative compatibility layer is
copied.

The public client API remains unchanged. Vendoring is an internal build detail
and does not add a new consumer-facing entry point.

### Build artifact

The client build remains a deterministic CommonJS closure wrapped as:

```js
window.__ModuleLoader__.load({ id, factory })
```

Local CSS modules are compiled by the plugin build, class export keys are
sorted, and styles are injected with stable plugin-owned identifiers. Generated
code contains no absolute checkout paths.

`dsh.client.inject` remains responsible for loading the Host modules that
provide connection, locale, slots, conversation, and sidebar services. It is
not used as a source-code dependency mechanism.

### Host boundary

Host-side imports that participate in DSH service contracts remain pinned,
optional peer dependencies at `0.1.0-rc.6`. Ordinary implementation libraries
that must travel with the plugin remain regular dependencies or are bundled as
already specified by the release-readiness plan.

## Testing

Verification has four layers:

1. Source unit tests exercise Workspace behavior using local client code.
2. A packaged-client test loads the generated `client.js`, captures the
   ModuleLoader handoff, supplies only the allowed Host modules, and verifies
   plugin registration and style injection.
3. A clean archive outside every pnpm workspace runs frozen install,
   typecheck, unit tests, build, and pack without the Harness checkout.
4. Clean-profile and browser tests install the tarball into DSH rc.6 and verify
   the real UI, including destructive menu styling.

Tests must not synthesize missing upstream class maps, alias into another
repository, import unpublished package source paths, or weaken behavior to fit
the rc.6 package defect.

## Error handling and compatibility

The build fails when a browser runtime import from an unsupported DSH client
package reappears, when the final bundle requires a module outside the explicit
Host allowlist, or when deterministic output checks detect path leakage or byte
drift.

Host and public plugin behavior remain backward compatible. The change replaces
only internal browser implementation dependencies and fixes the published UI's
missing style behavior.

## Rejected alternatives

- **Patch rc.6 bundles during tests:** this verifies a synthetic package rather
  than the artifact users run and would conceal production CSS loss.
- **Modify or publish DeepSeek Harness:** outside this plugin's ownership and
  explicitly prohibited.
- **Copy the complete client framework:** unnecessary maintenance burden; the
  vendored surface is limited to reachable plugin code.
- **Relax the existing UI assertions:** would turn a real packaging defect into
  an undetected release regression.

