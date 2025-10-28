# Contributing to OpenLibX402

Thank you for your interest in contributing to OpenLibX402! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/openlibx402/openlibx402/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, etc.)
   - Code samples if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach
   - Any drawbacks or considerations

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Format code with `black`
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to your branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/openlibx402.git
cd openlibx402

# Install packages in development mode
pip install -e "packages/python/openlibx402-core[dev]"
pip install -e "packages/python/openlibx402-fastapi[dev]"
pip install -e "packages/python/openlibx402-client[dev]"
pip install -e "packages/python/openlibx402-langchain[dev]"
pip install -e "packages/python/openlibx402-langgraph[dev]"

# Install development tools
pip install black ruff mypy pytest pytest-asyncio
```

## Coding Standards

### Python Style

- Follow PEP 8
- Use `black` for formatting (line length 88)
- Use type hints where possible
- Write docstrings for all public APIs
- Keep functions focused and small

### Code Formatting

```bash
# Format all Python code
black packages/python/

# Check for issues
ruff check packages/python/

# Type checking
mypy packages/python/openlibx402-core
```

### Testing

```bash
# Run all tests
pytest

# Run tests for specific package
pytest packages/python/openlibx402-core/tests

# Run with coverage
pytest --cov=openlibx402_core

# Run async tests
pytest -v tests/test_async.py
```

### Writing Tests

- Write tests for all new functionality
- Aim for high test coverage (>80%)
- Use meaningful test names
- Use mock implementations for blockchain interactions
- Test both success and error cases

Example test:

```python
import pytest
from openlibx402_core.testing import MockSolanaPaymentProcessor, create_mock_payment_request

@pytest.mark.asyncio
async def test_payment_flow():
    """Test complete payment flow"""
    processor = MockSolanaPaymentProcessor()
    processor.balance = 100.0

    request = create_mock_payment_request(amount="0.10")

    # Test payment creation
    tx = await processor.create_payment_transaction(request, "0.10", keypair)
    assert tx is not None

    # Test transaction broadcast
    tx_hash = await processor.sign_and_send_transaction(tx, keypair)
    assert tx_hash.startswith("mock_tx_")
```

## Documentation

### Code Documentation

- Write clear docstrings for all public APIs
- Include usage examples in docstrings
- Document parameters, return values, and exceptions
- Keep docstrings up to date with code changes

Example docstring:

```python
def payment_required(
    amount: str,
    payment_address: str,
    token_mint: str,
) -> Callable:
    """
    Decorator for FastAPI endpoints requiring payment

    Usage:
        @app.get("/premium-data")
        @payment_required(
            amount="0.10",
            payment_address="WALLET_ADDRESS",
            token_mint="USDC_MINT"
        )
        async def get_premium_data():
            return {"data": "Premium content"}

    Args:
        amount: Payment amount required in token units
        payment_address: Recipient wallet address
        token_mint: SPL token mint address

    Returns:
        Decorated function that enforces payment

    Raises:
        HTTPException: If payment is missing or invalid
    """
```

### README Updates

- Update relevant README files when adding features
- Include usage examples
- Keep installation instructions current
- Document breaking changes

## Project Structure

When adding new functionality, follow the existing structure:

```
packages/python/
├── openlibx402-core/          # Core protocol - no framework dependencies
├── openlibx402-fastapi/       # FastAPI-specific code
├── openlibx402-client/        # HTTP client implementation
├── openlibx402-langchain/     # LangChain integration
└── openlibx402-langgraph/     # LangGraph integration
```

## Commit Messages

Use clear, descriptive commit messages:

```
Add payment verification for FastAPI endpoints

- Implement verify_payment dependency
- Add support for on-chain verification
- Include tests for verification flow
```

## Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be included in the next release

## Release Process

1. Version numbers follow semantic versioning (MAJOR.MINOR.PATCH)
2. Changes are documented in CHANGELOG.md
3. Releases are tagged in Git
4. Packages are published to PyPI

## Questions?

- Check the [documentation](docs/)
- Search [existing issues](https://github.com/openlibx402/openlibx402/issues)
- Ask in discussions or open a new issue

Thank you for contributing to OpenLibX402! 🚀
