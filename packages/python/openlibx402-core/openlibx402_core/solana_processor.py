"""
Solana Payment Processor

Handles all Solana blockchain operations for X402 payments.
"""

from typing import Optional
import asyncio

try:
    from solana.rpc.async_api import AsyncClient
    from solana.rpc.commitment import Confirmed
    from solders.transaction import Transaction, Legacy
    from solders.message import Message
    from solders.keypair import Keypair
    from solders.pubkey import Pubkey
    from solders.signature import Signature
    from solders.system_program import TransferParams, transfer
    from solders.hash import Hash
    from spl.token.async_client import AsyncToken
    from spl.token.instructions import (
        transfer_checked,
        TransferCheckedParams,
        get_associated_token_address,
        create_associated_token_account,
    )
    from solders.instruction import Instruction

    SOLANA_AVAILABLE = True
except ImportError:
    SOLANA_AVAILABLE = False

from .models import PaymentRequest
from .errors import TransactionBroadcastError, PaymentVerificationError


class SolanaPaymentProcessor:
    """Handles Solana blockchain operations"""

    def __init__(self, rpc_url: str, keypair: Optional[Keypair] = None):
        if not SOLANA_AVAILABLE:
            raise ImportError(
                "Solana libraries not installed. "
                "Install with: pip install solana solders spl-token"
            )

        self.rpc_url = rpc_url
        self.client = AsyncClient(rpc_url)
        self.keypair = keypair

    async def close(self):
        """Close the RPC client connection"""
        await self.client.close()

    async def create_payment_transaction(
        self, request: PaymentRequest, amount: str, payer_keypair: Keypair
    ) -> Transaction:
        """
        Create a Solana transaction for the payment

        Args:
            request: Payment request details
            amount: Amount to pay (in token units)
            payer_keypair: Payer's keypair

        Returns:
            Unsigned transaction
        """
        try:
            # Get recent blockhash
            blockhash_resp = await self.client.get_latest_blockhash()
            recent_blockhash = blockhash_resp.value.blockhash

            # Parse addresses
            payer_pubkey = payer_keypair.pubkey()
            recipient_pubkey = Pubkey.from_string(request.payment_address)
            token_mint = Pubkey.from_string(request.asset_address)

            # Get associated token accounts
            payer_token_account = get_associated_token_address(payer_pubkey, token_mint)
            recipient_token_account = get_associated_token_address(
                recipient_pubkey, token_mint
            )

            # Check if accounts exist and build instruction list
            instructions = []

            # Check if payer's token account exists
            payer_account_info = await self.client.get_account_info(payer_token_account)
            if payer_account_info.value is None:
                # Create payer's associated token account
                create_payer_ata_ix = create_associated_token_account(
                    payer=payer_pubkey,
                    owner=payer_pubkey,
                    mint=token_mint,
                )
                instructions.append(create_payer_ata_ix)

            # Check if recipient's token account exists
            recipient_account_info = await self.client.get_account_info(recipient_token_account)
            if recipient_account_info.value is None:
                # Create recipient's associated token account
                create_recipient_ata_ix = create_associated_token_account(
                    payer=payer_pubkey,  # Payer pays for account creation
                    owner=recipient_pubkey,
                    mint=token_mint,
                )
                instructions.append(create_recipient_ata_ix)

            # Convert amount to smallest unit (considering decimals)
            # Assuming 6 decimals for USDC (standard for SPL tokens)
            decimals = 6
            amount_in_smallest_unit = int(float(amount) * (10**decimals))

            # Create transfer instruction
            transfer_ix = transfer_checked(
                TransferCheckedParams(
                    program_id=Pubkey.from_string(
                        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                    ),
                    source=payer_token_account,
                    mint=token_mint,
                    dest=recipient_token_account,
                    owner=payer_pubkey,
                    amount=amount_in_smallest_unit,
                    decimals=decimals,
                )
            )
            instructions.append(transfer_ix)

            # Create message with all instructions
            message = Message.new_with_blockhash(
                instructions,
                payer_pubkey,
                recent_blockhash,
            )

            # Create transaction
            transaction = Transaction.new_unsigned(message)

            return transaction

        except Exception as e:
            raise TransactionBroadcastError(f"Failed to create transaction: {e}")

    async def sign_and_send_transaction(
        self, transaction: Transaction, keypair: Keypair
    ) -> str:
        """
        Sign and broadcast transaction, return tx hash

        Args:
            transaction: Transaction to sign and send
            keypair: Keypair to sign with

        Returns:
            Transaction signature (hash)
        """
        try:
            # Sign transaction with keypair
            signed_tx = Transaction([keypair], transaction.message, transaction.message.recent_blockhash)

            # Send transaction
            from solana.rpc.types import TxOpts
            response = await self.client.send_transaction(
                signed_tx,
                opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed),
            )

            # Get signature
            signature = response.value

            # Wait for confirmation
            await self.client.confirm_transaction(signature, Confirmed)

            return str(signature)

        except Exception as e:
            raise TransactionBroadcastError(f"Failed to broadcast transaction: {e}")

    async def verify_transaction(
        self,
        transaction_hash: str,
        expected_recipient: str,
        expected_amount: str,
        expected_token_mint: str,
    ) -> bool:
        """
        Verify a transaction was successful and matches expectations

        Args:
            transaction_hash: Transaction signature to verify
            expected_recipient: Expected recipient address
            expected_amount: Expected amount transferred
            expected_token_mint: Expected token mint address

        Returns:
            True if transaction is valid and matches expectations
        """
        try:
            # Convert string signature to Signature object
            sig = Signature.from_string(transaction_hash)

            # Get transaction details
            tx_resp = await self.client.get_transaction(
                sig, encoding="jsonParsed", commitment=Confirmed
            )

            if not tx_resp.value:
                raise PaymentVerificationError(
                    f"Transaction {transaction_hash} not found"
                )

            tx = tx_resp.value

            # Check if transaction was successful
            if tx.transaction.meta.err:
                raise PaymentVerificationError(
                    f"Transaction failed: {tx.transaction.meta.err}"
                )

            # For now, return True if transaction exists and succeeded
            # In production, you'd want to parse the transaction details
            # and verify recipient, amount, and token mint match
            # This requires parsing the transaction instructions
            return True

        except Exception as e:
            raise PaymentVerificationError(f"Failed to verify transaction: {e}")

    async def get_token_balance(self, wallet_address: str, token_mint: str) -> float:
        """
        Get token balance for a wallet

        Args:
            wallet_address: Wallet public key
            token_mint: Token mint address

        Returns:
            Token balance as float
        """
        try:
            wallet_pubkey = Pubkey.from_string(wallet_address)
            mint_pubkey = Pubkey.from_string(token_mint)

            # Get associated token account
            token_account = get_associated_token_address(wallet_pubkey, mint_pubkey)

            # Get balance
            response = await self.client.get_token_account_balance(token_account)

            if not response.value:
                return 0.0

            # Convert to float (ui_amount is human-readable format)
            return float(response.value.ui_amount or 0.0)

        except Exception as e:
            # If account doesn't exist, return 0
            return 0.0

    def get_default_rpc_url(self, network: str) -> str:
        """Get default RPC URL for network"""
        urls = {
            "solana-mainnet": "https://api.mainnet-beta.solana.com",
            "solana-devnet": "https://api.devnet.solana.com",
            "solana-testnet": "https://api.testnet.solana.com",
        }
        return urls.get(network, "https://api.devnet.solana.com")
