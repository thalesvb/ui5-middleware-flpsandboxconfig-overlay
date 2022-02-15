Fiori Sandbox Config Overlay UI5 Middleware: turn your Sandbox Launchpad into a warming place
===

Whenever you use Sandbox Launchpad with your own written config it merely lists the things from your project. This is a nightmare if your purpose is to develop a Launchpad Plugin because you get restricted on tests or have to copy/maintain a rather long sandbox configuration.

This Middleware allows you to overlay (merge) two configurations (at least for now) on the fly.

Have fun!

Configuration options
---

- base: `string` or `ResourceConfig`
- overlay: `string` or `ResourceConfig`

Types:
- `ResourceConfig`
  - kind: `string`
    Possible values are: `local`, `remote`. Defaults to `local`.
  - path: `string`
  - replace: `object`
    Allows you to replace a pattern on resource contents. Useful to fix relative paths.
    - find: `string`
    - replace: `string`

Usage
---
1. Add it to your project development dependency (either manually or through package managers) and also on ui5 dependencies on `package.json`.
```json
"devDependencies": {
  "@thalesvb/ui5-middleware-flpsandboxconfig": "<version>"
},
"ui5": {
  "dependencies": [
    "@thalesvb/ui5-middleware-flpsandboxconfig",
  ]
}
```
2. Configure it on your `ui5.yaml`. The example below uses a remote resource as the base sandbox configuration and a local file to overlay it.
```yaml
server:
  customMiddleware:
  - name: thalesvb/ui5-middleware-flpsandboxconfig-overlay
    afterMiddleware: compression
    configuration:
      base: 
        path: http://remote.example/some/path/fioriSandboxConfig.json
        kind: remote
        replace:
          find: "test-resources"
          replace: "/test-resources"
      overlay: webapp/appconfig/fioriSandboxConfig.json
```
