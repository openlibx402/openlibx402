"""
OpenLibx402 Payment Models

Defines core data structures for X402 payment protocol.
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional
import json
import base64

from .errors import InvalidPaymentRequestError


@dataclass
class PaymentRequest:
    """Represents an X402 payment request (402 response)"""

    max_amount_required: str  # Amount in token units (e.g., "0.10")
    asset_type: str  # "SPL" for Solana tokens
    asset_address: str  # Token mint address
    payment_address: str  # Recipient's wallet address
    network: str  # "solana-devnet" | "solana-mainnet"
    expires_at: datetime  # Expiration timestamp
    nonce: str  # Unique identifier for replay protection
    payment_id: str  # Unique payment request ID
    resource: str  # API endpoint being accessed
    description: Optional[str] = None  # Human-readable description

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict"""
        data = asdict(self)
        # Convert datetime to ISO format string
        data["expires_at"] = self.expires_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "PaymentRequest":
        """Parse from 402 response JSON"""
        try:
            # Parse datetime from ISO format
            if isinstance(data.get("expires_at"), str):
                data["expires_at"] = datetime.fromisoformat(
                    data["expires_at"].replace("Z", "+00:00")
                )
            elif isinstance(data.get("expires_at"), datetime):
                pass  # Already a datetime object
            else:
                raise ValueError("expires_at must be a datetime or ISO format string")

            return cls(**data)
        except (KeyError, TypeError, ValueError) as e:
            raise InvalidPaymentRequestError(f"Failed to parse payment request: {e}")

    def is_expired(self) -> bool:
        """Check if payment request has expired"""
        # Ensure both datetimes are timezone-aware for comparison
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at

        # If expires_at is naive, assume UTC
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return now > expires_at

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())


@dataclass
class PaymentAuthorization:
    """Signed payment authorization to be sent with retry request"""

    payment_id: str  # From payment request
    actual_amount: str  # Amount being paid (≤ max_amount_required)
    payment_address: str  # Recipient address
    asset_address: str  # Token mint address
    network: str  # Blockchain network
    timestamp: datetime  # Authorization timestamp
    signature: str  # Solana signature
    public_key: str  # Payer's public key
    transaction_hash: Optional[str] = None  # On-chain tx hash (after broadcast)

    def to_header_value(self) -> str:
        """Encode as X-Payment-Authorization header value"""
        data = {
            "payment_id": self.payment_id,
            "actual_amount": self.actual_amount,
            "payment_address": self.payment_address,
            "asset_address": self.asset_address,
            "network": self.network,
            "timestamp": self.timestamp.isoformat(),
            "signature": self.signature,
            "public_key": self.public_key,
            "transaction_hash": self.transaction_hash,
        }
        # Encode as base64 JSON for header
        json_str = json.dumps(data)
        encoded = base64.b64encode(json_str.encode()).decode()
        return encoded

    @classmethod
    def from_header(cls, header_value: str) -> "PaymentAuthorization":
        """Parse from request header"""
        try:
            # Decode base64
            decoded = base64.b64decode(header_value.encode()).decode()
            data = json.loads(decoded)

            # Parse datetime
            if isinstance(data.get("timestamp"), str):
                data["timestamp"] = datetime.fromisoformat(
                    data["timestamp"].replace("Z", "+00:00")
                )

            return cls(**data)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as e:
            raise InvalidPaymentRequestError(
                f"Failed to parse payment authorization: {e}"
            )

    def to_dict(self) -> dict:
        """Convert to dict"""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())
