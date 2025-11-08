
This CI pipeline uses the latest and greatest tooling to run all sorts of checks in a python project.

- UV for python dependency management and virtual environments
- checks `uv.lock` for consistency
- `ruff` for linting
- `ruff` for formatting
- `pyright` for static type checking
- `pytest` for testing
- `pytest-cov` for coverage
- building a wheel
