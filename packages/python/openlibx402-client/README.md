# openlibx402-client (Python)

This package provides the Python client for interacting with the OpenLibX402 protocol and services.

## Features

- Easy integration with OpenLibX402 APIs
- Authentication and wallet management
- Request/response handling
- Utilities for common protocol operations

## Installation

```bash
pip install .
```
Or add to your requirements.txt:
```
openlibx402-client
```

## Usage

```python
from openlibx402_client import Client
client = Client(api_key="YOUR_API_KEY")
response = client.do_something()
print(response)
```

## Documentation

See [docs](https://openlibx402.github.io/docs/packages/python/openlibx402-client/) for API reference and guides.

## Testing

```bash
pytest tests/
```

## Contributing

See [CONTRIBUTING.md](https://github.com/openlibx402/openlibx402/blob/main/CONTRIBUTING.md).

## License

See [LICENSE](https://github.com/openlibx402/openlibx402/blob/main/LICENSE).
