# Local Web Preview Harness

Use this lightweight browser harness when Cocos Creator has imported the project but the editor preview server is not currently listening.

```bash
npm run preview:web
```

Open:

```text
http://127.0.0.1:4173/web-preview/index.html
```

The harness reads `assets/resources/levels/level-001.json` and uses the placeholder PNG assets under `assets/resources/art/placeholder`. It is a local verification aid only. The Cocos scene remains the production entry point for Creator preview and future platform builds.
