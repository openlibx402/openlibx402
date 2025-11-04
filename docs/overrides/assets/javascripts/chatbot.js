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
      if (response.ok) {
        const data = await response.json();
        rateLimitInfo = data.rateLimit;
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
          <a href="#" onclick="window.chatbotShowPayment(); return false;">Pay 0.1 USDC</a> for more queries.
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
    alert('Payment feature coming soon! This will integrate with Solana to accept USDC payments.');
    // TODO: Implement payment UI with Solana wallet integration
  };

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
