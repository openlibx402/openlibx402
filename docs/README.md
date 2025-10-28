## Documentation Workspace

This directory hosts the MkDocs project for the OpenLibX402 documentation portal.

### Quick commands

- `uv run mkdocs serve` — run a local dev server with live reload.
- `uv run mkdocs build` — generate the static site into `site/`.

### Dependency management

The documentation tooling lives in `pyproject.toml`. Install new packages with `uv pip install ...` so that they are captured in `uv.lock`.
