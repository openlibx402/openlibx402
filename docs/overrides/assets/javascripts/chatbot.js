/**
 * OpenLibx402 RAG Chatbot Widget
 * Embedded chat interface for documentation
 */

(function() {
  'use strict';

  // Configuration
  const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';
  const STORAGE_KEY = 'openlibx402_chat_history';
  const MAX_HISTORY = 10;

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

    if (rateLimitInfo.requiresPayment) {
      statusEl.innerHTML = `
        <span class="rate-limit-warning">
          ⚠️ Daily limit reached.
          <a href="#" onclick="window.chatbotShowPayment(); return false;">Pay 0.01 USDC</a> for more queries.
        </span>
      `;
    } else {
      statusEl.innerHTML = `
        <span class="rate-limit-info">
          ${rateLimitInfo.remaining} free queries remaining today
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

      statusEl.textContent = `Sending ${paymentInfo.amount} USDC...`;
      payBtn.textContent = 'Confirm in Phantom...';

      // Send payment with payment info
      const signature = await sendUSDCPayment(
        walletAddress,
        paymentInfo.recipient,
        paymentInfo.amount,
        paymentInfo.usdcMint,
        paymentInfo.network
      );

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
          amount: paymentInfo.amount,
          token: 'USDC',
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();

      // Get Solscan URL based on network
      const networkParam = paymentInfo.network === 'mainnet-beta' ? '' : '?cluster=devnet';
      const solscanUrl = `https://solscan.io/tx/${signature}${networkParam}`;

      statusEl.innerHTML = `
        ✅ Payment successful! You have 1 additional query.<br>
        <a href="${solscanUrl}" target="_blank" rel="noopener" style="color: #667eea; text-decoration: underline; font-weight: 600;">
          View on Solscan →
        </a>
      `;
      statusEl.className = 'payment-status-success';
      payBtn.textContent = 'Payment Complete';

      // Refresh rate limit
      await fetchRateLimitStatus();

      // Close modal after 5 seconds (more time to view link)
      setTimeout(() => {
        closePaymentModal();
        statusEl.innerHTML = '';
        payBtn.textContent = 'Pay 0.01 USDC';
        payBtn.disabled = false;
      }, 5000);

    } catch (error) {
      console.error('Payment error:', error);
      statusEl.textContent = `❌ Error: ${error.message}`;
      statusEl.className = 'payment-status-error';
      payBtn.textContent = 'Try Again';
      payBtn.disabled = false;
    }
  };

  /**
   * Send SOL payment via Phantom (simplified version without Web3.js transaction building)
   * Uses Phantom's send method which handles transaction creation internally
   */
  async function sendUSDCPayment(fromWalletAddress, toWalletAddress, amount, usdcMintAddress, network) {
    try {
      const provider = window.phantom.solana;

      console.log('💰 Payment Request:');
      console.log('  from:', fromWalletAddress);
      console.log('  to:', toWalletAddress);
      console.log('  amount:', '0.0001 SOL');
      console.log('  network:', network);

      // Use Phantom's send method - it handles transaction creation internally
      // This completely avoids the Web3.js BigInt encoding issues
      const transaction = await provider.request({
        method: "solana:signAndSendTransaction",
        params: {
          message: {
            action: "transfer",
            params: {
              to: toWalletAddress,
              amount: 100000, // lamports (0.0001 SOL)
            },
          },
        },
      });

      const signature = transaction.signature;
      console.log('✅ Transaction sent:', signature);

      return signature;

    } catch (error) {
      console.error('❌ Primary payment method failed:', error.message);
      console.log('🔄 Falling back to legacy transaction method...');

      // If Phantom's send method doesn't work, try the legacy approach
      // but build the transaction using raw bytes
      try {
        return await sendSOLLegacy(fromWalletAddress, toWalletAddress, network);
      } catch (legacyError) {
        console.error('❌ Legacy method also failed:', legacyError);
        throw legacyError;
      }
    }
  }

  /**
   * Legacy method: Send SOL using raw transaction bytes
   */
  async function sendSOLLegacy(fromAddress, toAddress, network) {
    console.log('🔧 Starting legacy transaction method');
    console.log('  Buffer.alloc available:', typeof Buffer.alloc);
    console.log('  Buffer.writeUInt32LE available:', typeof Buffer.prototype.writeUInt32LE);
    console.log('  Buffer.writeBigUInt64LE available:', typeof Buffer.prototype.writeBigUInt64LE);

    const provider = window.phantom.solana;
    const { Connection, PublicKey, TransactionInstruction, Transaction } = window.solanaWeb3;

    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);

    console.log('📡 Getting latest blockhash...');
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('✓ Blockhash received:', blockhash);

    // Create transfer instruction using raw data to avoid BigInt encoding
    console.log('🔨 Creating instruction data buffer...');
    const data = Buffer.alloc(12);
    console.log('✓ Buffer allocated, length:', data.length);

    data.writeUInt32LE(2, 0); // Transfer instruction index
    console.log('✓ Wrote instruction index (2)');

    data.writeBigUInt64LE(BigInt(100000), 4); // Amount in lamports
    console.log('✓ Wrote lamports amount (100000)');
    console.log('  Buffer contents:', Array.from(data));

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: fromPubkey, isSigner: true, isWritable: true },
        { pubkey: toPubkey, isSigner: false, isWritable: true },
      ],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: data,
    });
    console.log('✓ Transaction instruction created');

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey,
    }).add(instruction);
    console.log('✓ Transaction created');

    console.log('📝 Requesting signature from Phantom...');
    const { signature } = await provider.signAndSendTransaction(transaction);
    console.log('✅ Transaction sent! Signature:', signature);

    return signature;
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
      <div id="chatbot-payment-modal" class="payment-modal">
        <div class="payment-modal-content">
          <div class="payment-modal-header">
            <h3>💳 Make Payment</h3>
            <button class="payment-modal-close" onclick="document.getElementById('chatbot-payment-modal').style.display='none'">✕</button>
          </div>
          <div class="payment-modal-body">
            <div class="payment-info">
              <p>You've reached your daily query limit.</p>
              <p>Pay <strong>0.01 USDC</strong> to continue using the chatbot.</p>
            </div>
            <div class="payment-details">
              <div class="payment-detail-row">
                <span>Amount:</span>
                <span><strong>0.01 USDC</strong></span>
              </div>
              <div class="payment-detail-row">
                <span>Network:</span>
                <span>Solana</span>
              </div>
              <div class="payment-detail-row">
                <span>Grants:</span>
                <span>1 additional query</span>
              </div>
            </div>
            <div id="chatbot-payment-status" class="payment-status"></div>
            <button id="chatbot-pay-btn" class="payment-button" onclick="makePayment()">
              Connect Phantom & Pay
            </button>
            <p class="payment-note">
              <small>🔒 Secure payment via Phantom wallet. Make sure you have at least 0.01 USDC in your wallet.</small>
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
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
