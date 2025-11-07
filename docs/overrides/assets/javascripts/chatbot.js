/**
 * OpenLibx402 RAG Chatbot Widget
 * Embedded chat interface for documentation
 */

(function() {
  'use strict';

  // Configuration
  const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';
  const SOLANA_NETWORK = window.CHATBOT_SOLANA_NETWORK || 'devnet';
  const SOLANA_RPC_URL = window.CHATBOT_SOLANA_RPC || 'https://api.devnet.solana.com';
  const STORAGE_KEY = 'openlibx402_chat_history';
  const MAX_HISTORY = 10;

  // Network display names
  const NETWORK_DISPLAY = {
    'devnet': 'Solana Devnet',
    'mainnet-beta': 'Solana Mainnet'
  };

  // Get the base URL for documentation links
  const getDocsBaseUrl = () => {
    const url = new URL(window.location.href);
    return `${url.protocol}//${url.host}/docs/`;
  };

  // State
  let conversationHistory = [];
  let rateLimitInfo = null;

  /**
   * Load conversation history from localStorage
   */
  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        conversationHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }

  /**
   * Save conversation history to localStorage
   */
  function saveHistory() {
    try {
      // Keep only last MAX_HISTORY messages
      const toSave = conversationHistory.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }

  /**
   * Fetch rate limit status
   */
  async function fetchRateLimitStatus() {
    try {
      const response = await fetch(`${API_URL}/api/status`);

      // Handle both 200 OK and 402 Payment Required responses
      if (response.ok) {
        const data = await response.json();
        rateLimitInfo = data.rateLimit;
        updateRateLimitDisplay();
      } else if (response.status === 402) {
        // Rate limit exceeded - extract payment info
        const data = await response.json();
        rateLimitInfo = {
          remaining: data.remaining || 0,
          resetAt: data.resetAt,
          requiresPayment: true,
        };
        updateRateLimitDisplay();
      }
    } catch (e) {
      console.error('Failed to fetch rate limit status:', e);
    }
  }

  /**
   * Update rate limit display
   */
  function updateRateLimitDisplay() {
    const statusEl = document.getElementById('chatbot-rate-limit');
    if (!statusEl || !rateLimitInfo) return;

    if (rateLimitInfo.requiresPayment && rateLimitInfo.remaining === 0) {
      statusEl.innerHTML = `
        <span class="rate-limit-warning">
          ⚠️ Daily limit reached.
          <a href="#" onclick="window.chatbotShowPayment(); return false;">Pay 0.01 USDC</a> for more queries.
        </span>
      `;
    } else if (rateLimitInfo.remaining > 0) {
      statusEl.innerHTML = `
        <span class="rate-limit-info">
          ✅ ${rateLimitInfo.remaining} ${rateLimitInfo.remaining === 1 ? 'query' : 'queries'} remaining today
        </span>
      `;
    } else {
      // Show nothing or a neutral message
      statusEl.innerHTML = `
        <span class="rate-limit-info">
          Ready to chat
        </span>
      `;
    }
  }

  /**
   * Add message to chat
   */
  function addMessage(role, content, sources = []) {
    const messagesEl = document.getElementById('chatbot-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `chatbot-message chatbot-message-${role}`;

    // Render markdown for assistant messages
    const renderedContent = role === 'assistant' ? renderMarkdown(content) : `<p>${escapeHtml(content)}</p>`;
    let html = `<div class="chatbot-message-content">${renderedContent}</div>`;

    if (sources && sources.length > 0) {
      html += '<div class="chatbot-sources"><strong>Sources:</strong><ul>';
      sources.forEach(source => {
        const relevance = Math.round(source.relevance * 100);
        const url = sourceToUrl(source.file);
        const displayName = source.file;
        const section = source.section ? ` (${escapeHtml(source.section)})` : '';
        html += `<li><a href="${url}" target="_blank" rel="noopener">${escapeHtml(displayName)}</a>${section} - ${relevance}% relevant</li>`;
      });
      html += '</ul></div>';
    }

    messageEl.innerHTML = html;
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Simple markdown renderer
   * Converts markdown to HTML with support for:
   * - Code blocks (```language)
   * - Inline code (`code`)
   * - Bold (**text**)
   * - Italic (*text*)
   * - Links ([text](url))
   */
  function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks (```language\ncode\n```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
    });

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (*text* but not inside **)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  }

  /**
   * Convert source file path to full documentation URL
   */
  function sourceToUrl(sourceFile) {
    const baseUrl = getDocsBaseUrl();
    // Remove .md extension and create URL
    const path = sourceFile.replace(/\.md$/, '/');
    return `${baseUrl}${path}`;
  }

  /**
   * Send chat message
   */
  async function sendMessage(message) {
    if (!message.trim()) return;

    // Add user message to UI
    addMessage('user', message);

    // Add to conversation history
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chatbot-message chatbot-message-assistant';
    loadingEl.innerHTML = '<div class="chatbot-loading">Thinking...</div>';
    loadingEl.id = 'chatbot-loading';
    document.getElementById('chatbot-messages').appendChild(loadingEl);

    try {
      // Call API with streaming
      const response = await fetch(`${API_URL}/api/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-6), // Last 3 exchanges
        }),
      });

      if (response.status === 402) {
        // Rate limit exceeded
        const data = await response.json();
        removeLoading();
        addMessage('assistant', data.message || 'Rate limit exceeded. Please make a payment to continue.');
        await fetchRateLimitStatus();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Remove loading indicator
      removeLoading();

      // Handle SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let sources = [];
      let currentMessageEl = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'sources') {
                sources = parsed.sources;
              }
            } catch {
              // It's a text chunk
              assistantMessage += data;

              // Update or create message element
              if (!currentMessageEl) {
                currentMessageEl = document.createElement('div');
                currentMessageEl.className = 'chatbot-message chatbot-message-assistant';
                currentMessageEl.innerHTML = '<div class="chatbot-message-content"></div>';
                document.getElementById('chatbot-messages').appendChild(currentMessageEl);
              }

              // Render markdown while streaming
              const contentEl = currentMessageEl.querySelector('.chatbot-message-content');
              contentEl.innerHTML = renderMarkdown(assistantMessage);
              document.getElementById('chatbot-messages').scrollTop =
                document.getElementById('chatbot-messages').scrollHeight;
            }
          } else if (line.startsWith('event: done')) {
            // Add sources if available
            if (sources.length > 0 && currentMessageEl) {
              let sourcesHtml = '<div class="chatbot-sources"><strong>Sources:</strong><ul>';
              sources.forEach(source => {
                const relevance = Math.round(source.relevance * 100);
                const url = sourceToUrl(source.file);
                const displayName = source.file;
                const section = source.section ? ` (${escapeHtml(source.section)})` : '';
                sourcesHtml += `<li><a href="${url}" target="_blank" rel="noopener">${escapeHtml(displayName)}</a>${section} - ${relevance}% relevant</li>`;
              });
              sourcesHtml += '</ul></div>';
              currentMessageEl.innerHTML += sourcesHtml;
            }
          }
        }
      }

      // Add to conversation history
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      saveHistory();
      await fetchRateLimitStatus();

    } catch (error) {
      console.error('Chat error:', error);
      removeLoading();
      addMessage('assistant', 'Sorry, an error occurred. Please try again.');
    }
  }

  /**
   * Remove loading indicator
   */
  function removeLoading() {
    const loadingEl = document.getElementById('chatbot-loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  /**
   * Clear conversation
   */
  function clearConversation() {
    conversationHistory = [];
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('chatbot-messages').innerHTML = '';
    addMessage('assistant', 'Hi! I\'m here to help you with OpenLibx402 documentation. What would you like to know?');
  }

  /**
   * Show payment modal
   */
  window.chatbotShowPayment = function() {
    const modal = document.getElementById('chatbot-payment-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  /**
   * Close payment modal
   */
  function closePaymentModal() {
    const modal = document.getElementById('chatbot-payment-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Connect Phantom wallet
   */
  async function connectPhantomWallet() {
    try {
      // Check if Phantom is installed
      const isPhantomInstalled = window.phantom?.solana?.isPhantom;

      if (!isPhantomInstalled) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        window.open('https://phantom.app/', '_blank');
        return null;
      }

      // Connect to Phantom
      const resp = await window.phantom.solana.connect();
      return resp.publicKey.toString();
    } catch (error) {
      console.error('Failed to connect to Phantom:', error);
      alert('Failed to connect to Phantom wallet. Please try again.');
      return null;
    }
  }

  /**
   * Make payment using x402 protocol
   */
  window.makePayment = async function() {
    const payBtn = document.getElementById('chatbot-pay-btn');
    const statusEl = document.getElementById('chatbot-payment-status');

    try {
      payBtn.disabled = true;
      payBtn.textContent = 'Connecting wallet...';
      statusEl.textContent = 'Connecting to Phantom wallet...';
      statusEl.className = 'payment-status-info';

      // Connect wallet
      const walletAddress = await connectPhantomWallet();
      if (!walletAddress) {
        throw new Error('Wallet connection failed');
      }

      statusEl.textContent = `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
      payBtn.textContent = 'Preparing payment...';

      // Get payment info from backend
      const paymentInfo = await fetch(`${API_URL}/api/payment/info`).then(r => r.json());

      // Get selected amount from input
      const amountInput = document.getElementById('payment-amount-input');
      const selectedAmount = amountInput ? parseFloat(amountInput.value) : 0.01;
      const finalAmount = Math.max(0.01, Math.min(1, selectedAmount)); // Clamp between min and max

      statusEl.textContent = `Sending ${finalAmount} USDC...`;
      payBtn.textContent = 'Confirm in Phantom...';

      // Send payment with selected amount
      const signature = await sendUSDCPayment(
        walletAddress,
        paymentInfo.recipient,
        finalAmount,
        paymentInfo.usdcMint,
        paymentInfo.network
      );

      statusEl.textContent = 'Waiting for blockchain confirmation (30-60s)...';
      payBtn.textContent = 'Confirming...';

      // Wait a bit for blockchain confirmation before verifying
      await new Promise(resolve => setTimeout(resolve, 5000));

      statusEl.textContent = 'Verifying payment...';
      payBtn.textContent = 'Verifying...';

      // Submit payment to backend
      const response = await fetch(`${API_URL}/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          amount: finalAmount,
          token: 'USDC',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Payment verification failed';

        // Provide more helpful error messages
        if (errorMsg.includes('Transaction already used')) {
          throw new Error('This transaction has already been used. Please make a new payment.');
        } else if (errorMsg.includes('Invalid or unconfirmed transaction')) {
          throw new Error('Transaction not found or not confirmed yet. Please wait a moment and try again.');
        } else if (errorMsg.includes('Insufficient')) {
          throw new Error('Incorrect payment amount. Please send exactly 0.01 USDC to the recipient address.');
        } else if (response.status === 400) {
          throw new Error(`Payment verification failed: ${errorMsg}. Please ensure you sent 0.01 USDC (not SOL) to the correct address.`);
        } else {
          throw new Error(`Payment verification failed: ${errorMsg}`);
        }
      }

      const result = await response.json();

      // Get Solscan URL based on network
      const networkParam = paymentInfo.network === 'mainnet-beta' ? '' : '?cluster=devnet';
      const solscanUrl = `https://solscan.io/tx/${signature}${networkParam}`;

      const queriesGranted = result.queriesGranted || Math.floor(finalAmount * 1000);
      const queryText = queriesGranted === 1 ? 'query' : 'queries';

      statusEl.innerHTML = `
        ✅ Payment successful! Granted ${queriesGranted} ${queryText}.<br>
        <small>You now have ${result.rateLimit?.remaining || queriesGranted} ${result.rateLimit?.remaining === 1 ? 'query' : 'queries'} available.</small><br>
        <a href="${solscanUrl}" target="_blank" rel="noopener" style="color: #667eea; text-decoration: underline; font-weight: 600;">
          View on Solscan →
        </a>
      `;
      statusEl.className = 'payment-status-success';
      payBtn.textContent = 'Payment Complete';

      // Update rate limit info from server response (already updated in DB)
      if (result.rateLimit) {
        rateLimitInfo = result.rateLimit;
        console.log('✅ Rate limit updated from payment response:', rateLimitInfo);
      } else {
        // Fallback if server doesn't return rate limit info
        rateLimitInfo = {
          remaining: 1,
          resetAt: rateLimitInfo?.resetAt || Date.now() + 86400000,
          requiresPayment: false,
        };
      }
      updateRateLimitDisplay();

      // Close modal after 5 seconds (more time to view link)
      setTimeout(() => {
        closePaymentModal();
        statusEl.innerHTML = '';
        payBtn.textContent = 'Pay 0.01 USDC';
        payBtn.disabled = false;
      }, 5000);

    } catch (error) {
      console.error('Payment error:', error);

      // Provide helpful error messages with links
      let errorMessage = error.message;

      // Check if it's a wallet/token account issue
      if (error.message.includes('token account') || error.message.includes('insufficient funds')) {
        const faucetLink = SOLANA_NETWORK === 'devnet'
          ? `<br><br><span style="font-size: 0.9em;">
               💡 Need devnet USDC? Get free tokens from:<br>
               <a href="https://spl-token-faucet.com/" target="_blank" style="color: #667eea;">
                 spl-token-faucet.com
               </a>
             </span>`
          : '';
        errorMessage = `❌ ${error.message}${faucetLink}`;
        statusEl.innerHTML = errorMessage;
      } else {
        statusEl.textContent = `❌ ${errorMessage}`;
      }

      statusEl.className = 'payment-status-error';
      payBtn.textContent = 'Try Again';
      payBtn.disabled = false;
    }
  };

  /**
   * Send USDC payment via Phantom wallet
   * Creates an SPL Token transfer transaction
   */
  async function sendUSDCPayment(fromWalletAddress, toWalletAddress, amount, usdcMintAddress, network) {
    try {
      const provider = window.phantom.solana;

      console.log('💰 USDC Payment Request:');
      console.log('  from:', fromWalletAddress);
      console.log('  to:', toWalletAddress);
      console.log('  amount:', amount, 'USDC');
      console.log('  mint:', usdcMintAddress);
      console.log('  network:', network);

      // Use the legacy method directly for USDC token transfers
      // Phantom's simplified send method doesn't support SPL tokens
      return await sendUSDCLegacy(fromWalletAddress, toWalletAddress, amount, usdcMintAddress, network);

    } catch (error) {
      console.error('❌ USDC payment failed:', error.message);
      throw error;
    }
  }

  /**
   * Send USDC tokens using SPL Token transfer (manual implementation)
   * Since @solana/spl-token doesn't have an IIFE bundle, we create the instruction manually
   */
  async function sendUSDCLegacy(fromAddress, toAddress, amount, usdcMintAddress, network) {
    console.log('🔧 Starting USDC token transfer');

    // Check if required libraries are available
    if (!window.solanaWeb3) {
      throw new Error('Solana Web3.js library not loaded. Please refresh the page.');
    }

    const provider = window.phantom.solana;
    const { Connection, PublicKey, Transaction, TransactionInstruction } = window.solanaWeb3;

    console.log('✅ Solana Web3 library loaded');

    // Use the configured RPC URL from window config, with fallback to network-based selection
    const rpcUrl = SOLANA_RPC_URL || (network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com');
    const connection = new Connection(rpcUrl, 'confirmed');

    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    const mintPubkey = new PublicKey(usdcMintAddress);

    // SPL Token Program ID
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    console.log('📡 Getting latest blockhash...');
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('✓ Blockhash received:', blockhash);

    // Calculate Associated Token Accounts
    console.log('🔍 Calculating token accounts...');
    const fromTokenAccount = await findAssociatedTokenAddress(fromPubkey, mintPubkey, TOKEN_PROGRAM_ID);
    const toTokenAccount = await findAssociatedTokenAddress(toPubkey, mintPubkey, TOKEN_PROGRAM_ID);

    console.log('✓ From token account:', fromTokenAccount.toBase58());
    console.log('✓ To token account:', toTokenAccount.toBase58());

    // USDC has 6 decimals, so 0.01 USDC = 10,000 base units
    const tokenAmount = Math.floor(amount * 1_000_000);
    console.log('💵 Token amount:', tokenAmount, 'base units (', amount, 'USDC)');

    // Create TransferChecked instruction manually
    // Instruction layout: [12, amount (u64), decimals (u8)]
    console.log('🔨 Creating USDC transfer instruction...');

    // Use Uint8Array and DataView for proper byte manipulation in browser
    const dataLayout = new Uint8Array(10);
    const dataView = new DataView(dataLayout.buffer);

    dataView.setUint8(0, 12); // TransferChecked instruction discriminator
    dataView.setBigUint64(1, BigInt(tokenAmount), true); // amount as u64 (little-endian)
    dataView.setUint8(9, 6); // decimals

    console.log('✓ Instruction data:', Array.from(dataLayout));

    const transferInstruction = new TransactionInstruction({
      keys: [
        { pubkey: fromTokenAccount, isSigner: false, isWritable: true },  // source
        { pubkey: mintPubkey, isSigner: false, isWritable: false },       // mint
        { pubkey: toTokenAccount, isSigner: false, isWritable: true },    // destination
        { pubkey: fromPubkey, isSigner: true, isWritable: false },        // owner
      ],
      programId: TOKEN_PROGRAM_ID,
      data: dataLayout,
    });
    console.log('✓ Transfer instruction created');

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey,
    }).add(transferInstruction);
    console.log('✓ Transaction created');

    console.log('📝 Requesting signature from Phantom...');
    const { signature } = await provider.signAndSendTransaction(transaction);
    console.log('✅ USDC Transaction sent! Signature:', signature);

    return signature;
  }

  /**
   * Find Associated Token Address (manual implementation)
   */
  async function findAssociatedTokenAddress(walletAddress, tokenMintAddress, tokenProgramId) {
    const { PublicKey } = window.solanaWeb3;
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const [address] = await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        tokenProgramId.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return address;
  }

  /**
   * Initialize chatbot
   */
  function initChatbot() {
    // Create chatbot UI
    const chatbotHtml = `
      <div id="chatbot-widget" class="chatbot-widget">
        <div class="chatbot-header">
          <h3>OpenLibx402 Assistant</h3>
          <button id="chatbot-clear" title="Clear conversation">🗑️</button>
          <button id="chatbot-toggle" title="Close">✕</button>
        </div>
        <div id="chatbot-rate-limit" class="chatbot-rate-limit"></div>
        <div id="chatbot-messages" class="chatbot-messages"></div>
        <div class="chatbot-input-container">
          <input
            type="text"
            id="chatbot-input"
            placeholder="Ask about OpenLibx402..."
            autocomplete="off"
          />
          <button id="chatbot-send">Send</button>
        </div>
      </div>
      <button id="chatbot-fab" class="chatbot-fab" title="Open Chat">💬</button>

      <!-- Payment Modal -->
      <style>
        /* Custom Range Slider Styling */
        #payment-amount-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2196F3;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);
          transition: all 0.15s ease;
        }
        #payment-amount-input::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 8px rgba(33, 150, 243, 0.6);
        }
        #payment-amount-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2196F3;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);
          transition: all 0.15s ease;
        }
        #payment-amount-input::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 8px rgba(33, 150, 243, 0.6);
        }
      </style>
      <div id="chatbot-payment-modal" class="payment-modal">
        <div class="payment-modal-content">
          <div class="payment-modal-header">
            <h3>💳 Make Payment</h3>
            <button class="payment-modal-close" onclick="document.getElementById('chatbot-payment-modal').style.display='none'">✕</button>
          </div>
          <div class="payment-modal-body">
            <div class="payment-info">
              <p>You've reached your daily query limit.</p>
              <p>Choose how many queries you'd like to purchase:</p>
            </div>
            <div class="payment-amount-selector" style="margin: 20px 0;">
              <label for="payment-amount-input" style="display: block; margin-bottom: 12px; font-weight: 500; font-size: 0.95em;">
                Payment Amount: <span id="payment-amount-display" style="color: #2196F3; font-size: 1.1em;">0.01 USDC</span>
              </label>
              <input
                type="range"
                id="payment-amount-input"
                min="0.01"
                max="1"
                step="0.01"
                value="0.01"
                style="width: 100%; height: 6px; cursor: pointer; -webkit-appearance: none; appearance: none; background: linear-gradient(to right, #2196F3 0%, #2196F3 1%, #ddd 1%, #ddd 100%); border-radius: 5px; outline: none;"
              />
              <div style="display: flex; justify-content: space-between; font-size: 0.75em; color: #999; margin-top: 6px;">
                <span>0.01 USDC<br/>(10 queries)</span>
                <span style="text-align: right;">1.00 USDC<br/>(1000 queries)</span>
              </div>
              <div style="font-size: 0.95em; color: #333; margin-top: 16px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; text-align: center; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                You will receive: <strong id="queries-display" style="font-size: 1.2em;">10 queries</strong>
              </div>
            </div>
            <div class="payment-details">
              <div class="payment-detail-row">
                <span>Network:</span>
                <span id="payment-network-display">${NETWORK_DISPLAY[SOLANA_NETWORK] || 'Solana'}</span>
              </div>
            </div>
            <div class="payment-instructions" style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 12px 0; font-size: 0.85em;">
              <strong style="display: block; margin-bottom: 8px;">📝 Important:</strong>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>You must send <strong>USDC tokens</strong> (not SOL)</li>
                <li>Use the slider to select your desired amount</li>
                ${SOLANA_NETWORK === 'devnet' ? '<li>Need devnet USDC? Get free tokens at <a href="https://spl-token-faucet.com/" target="_blank" style="color: #667eea;">spl-token-faucet.com</a></li>' : ''}
              </ul>
            </div>
            <div id="chatbot-payment-status" class="payment-status"></div>
            <button id="chatbot-pay-btn" class="payment-button" onclick="makePayment()">
              Connect Phantom & Pay <span id="payment-button-amount">0.01</span> USDC
            </button>
            <p class="payment-note">
              <small>🔒 Secure payment via Phantom wallet</small>
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHtml);

    // Load history and show initial message
    loadHistory();
    if (conversationHistory.length === 0) {
      addMessage('assistant', 'Hi! I\'m here to help you with OpenLibx402 documentation. What would you like to know?');
    } else {
      // Restore conversation
      conversationHistory.forEach(msg => {
        addMessage(msg.role, msg.content);
      });
    }

    // Fetch initial rate limit status
    fetchRateLimitStatus();

    // Event listeners
    const widget = document.getElementById('chatbot-widget');
    const fab = document.getElementById('chatbot-fab');
    const toggle = document.getElementById('chatbot-toggle');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const clearBtn = document.getElementById('chatbot-clear');

    fab.addEventListener('click', () => {
      widget.classList.add('chatbot-widget-open');
      fab.style.display = 'none';
      input.focus();
    });

    toggle.addEventListener('click', () => {
      widget.classList.remove('chatbot-widget-open');
      fab.style.display = 'flex';
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Clear conversation history?')) {
        clearConversation();
      }
    });

    sendBtn.addEventListener('click', () => {
      const message = input.value;
      input.value = '';
      sendMessage(message);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = input.value;
        input.value = '';
        sendMessage(message);
      }
    });

    // Payment amount selector event listener
    const amountInput = document.getElementById('payment-amount-input');
    if (amountInput) {
      amountInput.addEventListener('input', updatePaymentDisplay);
      // Initialize display
      updatePaymentDisplay();
    }
  }

  /**
   * Update payment display based on selected amount
   */
  function updatePaymentDisplay() {
    const amountInput = document.getElementById('payment-amount-input');
    const amountDisplay = document.getElementById('payment-amount-display');
    const queriesDisplay = document.getElementById('queries-display');
    const buttonAmount = document.getElementById('payment-button-amount');

    if (!amountInput) return;

    let amount = parseFloat(amountInput.value) || 0.01;
    // Clamp between min and max
    amount = Math.max(0.01, Math.min(1, amount));
    amountInput.value = amount.toFixed(2);

    // Update slider gradient to show progress
    const percentage = ((amount - 0.01) / (1 - 0.01)) * 100;
    amountInput.style.background = `linear-gradient(to right, #2196F3 0%, #2196F3 ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;

    const queries = Math.floor(amount * 1000);
    const queryText = queries === 1 ? 'query' : 'queries';

    if (amountDisplay) amountDisplay.textContent = `${amount.toFixed(2)} USDC`;
    if (queriesDisplay) queriesDisplay.textContent = `${queries} ${queryText}`;
    if (buttonAmount) buttonAmount.textContent = amount.toFixed(2);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
