/*
 * Material Selector UI ported from SmiCalc production (2026-10-02).
 * Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 * Host configuration supplies labels, material registry and calculator navigation.
 */

(function (global) {
  "use strict";
  global.SmiCutMaterialSelector = Object.freeze({ mount(config) {
  const root = config.root;
  if (!root || root.dataset.smsInitialized === "true") return;
  const t = config.t || ((key, fallback) => fallback);
  const htmlText = (key, fallback) => escapeWidgetHtml(t("materialSelector." + key, fallback));
  const API_URL = config.apiUrl;
  const REQUEST_TIMEOUT_MS = config.requestTimeoutMs || 30000;
  const TXT = {
    thinking: t("materialSelector.thinking", "Thinking..."),
    pleaseEnterMaterial: t("materialSelector.enterMaterial", "Please enter a material."),
    errorFromServer: t("materialSelector.serverError", "Error from server."),
    noResponse: t("materialSelector.noResponse", "No response."),
    requestTimedOut: t("materialSelector.requestTimedOut", "Request timed out. Please try again."),
    networkOrServerError: t("materialSelector.networkError", "Network or server error."),
    initialMaterialSelectorMessage: t("materialSelector.welcome", "Enter a material designation and the tool will recommend the right SmiCut category.")
  };
  const messagesEl = root.querySelector('[data-sms-role="messages"]');
  const inputEl = root.querySelector('[data-sms-role="input"]');
  const sendBtn = root.querySelector('[data-sms-role="send"]');
  const applyBtn = root.querySelector('[data-sms-role="apply"]');
  const errorEl = root.querySelector('[data-sms-role="status"]');
  const conversation = [];

  if (!messagesEl || !inputEl || !sendBtn || !applyBtn || !errorEl) {
    return;
  }

  function escapeWidgetHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const panel = root.querySelector('.sms-panel');
  const retryBtn = root.querySelector('[data-sms-role="retry"]');
  let busy = false;
  let failedText = '';
  let started = false;
  const cards = [];
  function selectorIcon(name) {
    const paths = {
      up: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
      right: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      chat: '<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/>',
      layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>'
    };
    return '<svg class="sms-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  }
  function currentMaterial(index) {
    return config.isMaterialSelected(index);
  }
  function refreshCards() {
    cards.forEach(card => {
      const selected = currentMaterial(card.index);
      card.badge.hidden = !selected;
      card.help.hidden = selected;
      card.button.innerHTML = selected ? htmlText('openCalculator', 'Open calculator') + ' ' + selectorIcon('right') : selectorIcon('check') + ' ' + htmlText('apply', 'Use in SmiProg');
      if (!selected) card.chooser.hidden = true;
      card.button.setAttribute('aria-expanded', String(!card.chooser.hidden));
    });
  }
  config.changeRoot.addEventListener('change', refreshCards);
  function updateComposer() {
    sendBtn.disabled = busy || !inputEl.value.trim();
    sendBtn.innerHTML = started ? (busy ? '<span class="sms-send-spinner" aria-hidden="true"></span>' : selectorIcon('up')) : htmlText('findCategory', 'Find material category');
    sendBtn.setAttribute('aria-busy', String(busy));
    sendBtn.setAttribute('aria-label', busy ? t('materialSelector.sendingMessage', 'Sending message') : started ? t('materialSelector.sendMessage', 'Send message') : t('materialSelector.findCategory', 'Find material category'));
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(112, inputEl.scrollHeight) + 'px';
  }
  function startChat() {
    started = true;
    panel.classList.add('sms-started');
    root.querySelector('[data-sms-role="welcome"]').hidden = true;
    messagesEl.hidden = false;
    root.querySelector('[data-sms-role="label"]').innerHTML = selectorIcon('chat') + ' ' + htmlText('followUp', 'Ask a follow-up question or enter another material');
    inputEl.placeholder = t('materialSelector.messagePlaceholder', 'Write a message…');
  }
  function formatBotReply(raw) {
    const replyText = raw;

    let html = escapeWidgetHtml(replyText);

    html = html.replace(
      /(^|\n)##\s*([^\n]*(?:recommendation|rekommendation|anbefaling|recomendaci[oó]n|recommandation|empfehlung|aanbeveling|raccomandazione|zalecenie|rekomendasi|ajánlás|рекомендац|推奨|おすすめ|推荐|推薦|추천|권장)[^\n]*)\s*\n(?:\s*(?:👉|✅)\s*)?(?:\*\*)?(.+?)(?:\*\*)?\s*(?=\n|$)/gimu,
      function(match, prefix, heading, result) {
        return prefix + '<div class="sms-reply-heading sms-final-recommendation-heading">' + heading + '</div><div class="sms-final-recommendation-result">' + result + '</div>';
      }
    );

    html = html.replace(/^##\s+(.+?)\s*\n/gm, '<div class="sms-reply-heading">$1</div>');
    html = html.replace(/^##\s+(.+)$/gm, '<div class="sms-reply-heading">$1</div>');

    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function addMessage(text, role, updateMaterialMatch, materialCategoryKey) {
    const msg = document.createElement('div');
    msg.className = 'sms-message sms-message-' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') msg.textContent = text;
    else {
      const bridge = config.bridge;
      const index = materialCategoryKey ? bridge.findMaterialIndexFromKey(materialCategoryKey)
        : !/[?？]/.test(text) ? bridge.findMaterialIndexFromText(text) : -1;
      msg.innerHTML = '<div class="sms-sender">' + escapeWidgetHtml(config.productName || 'SmiProg') + '</div>';
      if (index >= 0) {
        const label = bridge.getMaterialLabel(index);
        const split = label.search(/\s*\((?:HB|HRC)/);
        const name = split < 0 ? label : label.slice(0, split);
        const spec = split < 0 ? '' : label.slice(split);
        const category = document.createElement('div');
        category.className = 'sms-category-result';
        category.innerHTML = '<div class="sms-category-result-label">' + selectorIcon('layers') + ' ' + htmlText('recommendedCategory', 'Recommended material category') + '</div><div class="sms-category-result-value">' + escapeWidgetHtml(name) + '</div><div class="sms-category-spec">' + escapeWidgetHtml(spec) + '</div>';
        msg.appendChild(category);
        const badge = document.createElement('div');
        badge.className = 'sms-selected'; badge.innerHTML = selectorIcon('check') + ' ' + htmlText('selected', 'Material selected'); badge.hidden = true;
        msg.appendChild(badge);
        const button = cards.length ? document.createElement('button') : applyBtn;
        button.type = 'button'; button.className = 'sms-apply-material'; button.hidden = false;
        msg.appendChild(button);
        const help = document.createElement('div'); help.className = 'sms-help';
        help.textContent = t('materialSelector.applyHelp', 'The material will be used in all calculators.'); msg.appendChild(help);
        const chooser = document.createElement('div'); chooser.className = 'sms-calculators'; chooser.hidden = true;
        config.calculators.forEach(calculator => {
          const choice = document.createElement('button'); choice.type = 'button';
          choice.dataset.smsCalculator = calculator.key;
          choice.textContent = calculator.label;
          choice.addEventListener('click', calculator.open); chooser.appendChild(choice);
        });
        msg.appendChild(chooser);
        cards.push({index, button, badge, chooser, help});
        button.addEventListener('click', () => {
          if (currentMaterial(index)) { chooser.hidden = !chooser.hidden; button.setAttribute('aria-expanded', String(!chooser.hidden)); }
          else if (bridge.applyMaterialIndex(index)) { refreshCards(); setMaterialCategoryStatus(t('materialSelector.selected', 'Material selected') + ': ' + label); }
        });
        refreshCards();
      }
      const explanation = document.createElement('div'); explanation.className = 'sms-explanation';
      explanation.innerHTML = formatBotReply(text);
      // Category recommendations always lead with the result; other replies stay visible.
      if (index >= 0) {
        const details = document.createElement('details');
        const summary = document.createElement('summary'); summary.textContent = t('materialSelector.showExplanation', 'Show explanation');
        details.append(summary, explanation);
        details.addEventListener('toggle', () => { summary.textContent = details.open ? t('materialSelector.hideExplanation', 'Hide explanation') : t('materialSelector.showExplanation', 'Show explanation'); });
        msg.appendChild(details);
      } else msg.appendChild(explanation);
    }
    const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 100;
    messagesEl.appendChild(msg);
    if (role === 'user' || nearBottom) messagesEl.scrollTop = Math.max(0, msg.offsetTop - messagesEl.offsetTop - 16);
    return msg;
  }

  function addLoadingMessage() {
    const msg = document.createElement("div");
    msg.className = "sms-message sms-message-bot sms-loading-message";
    msg.innerHTML = '<span class="sms-spinner" aria-hidden="true"></span><span>' + escapeWidgetHtml(TXT.thinking || "Thinking...") + '</span>';
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }

  function setMaterialCategoryStatus(value, isError) {
    errorEl.classList.toggle("sms-status-error", !!isError);
    errorEl.classList.toggle("sms-status-success", !isError);
    errorEl.textContent = value || "";
  }

  function getRequestHistory() {
    return conversation
      .filter(function (message) {
        return message
          && (message.role === "user" || message.role === "assistant")
          && typeof message.content === "string"
          && message.content.trim().length > 0;
      })
      .slice(-12);
  }

  async function sendMessage(retryText) {
    if (busy) return;
    const text = typeof retryText === "string" ? retryText : inputEl.value.trim();
    setMaterialCategoryStatus();
    if (!text) {
      setMaterialCategoryStatus(TXT.pleaseEnterMaterial || "Please enter a material.", true);
      return;
    }

    busy = true;
    retryBtn.hidden = true;
    startChat();
    if (!retryText || typeof retryText !== "string") { addMessage(text, "user"); inputEl.value = ""; }
    updateComposer();

    sendBtn.disabled = true;
    const history = getRequestHistory();
    const loadingMessage = addLoadingMessage();
    const controller = new AbortController();
    let timeoutId = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          language: config.getLanguage(),
          history: history
        })
      });
      const data = await response.json();
      window.clearTimeout(timeoutId);
      timeoutId = null;

      if (!response.ok) {
        failedText = text; retryBtn.hidden = false;
        removeMessage(loadingMessage);
        setMaterialCategoryStatus((data && data.reply) ? data.reply : (TXT.errorFromServer || "Error from server."), true);
        return;
      }

      const reply = (data && data.reply) ? data.reply : (TXT.noResponse || "No response.");
      const materialCategoryKey = (data && data.materialCategoryKey) ? data.materialCategoryKey : "";
      removeMessage(loadingMessage);
      addMessage(reply, "bot", true, materialCategoryKey);
      conversation.push({ role: "user", content: text });
      conversation.push({ role: "assistant", content: reply });
    } catch (e) {
      failedText = text; retryBtn.hidden = false;
      removeMessage(loadingMessage);
      setMaterialCategoryStatus(e && e.name === "AbortError" ? (TXT.requestTimedOut || "Request timed out. Please try again.") : (TXT.networkOrServerError || "Network or server error."), true);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      busy = false;
      updateComposer();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  retryBtn.addEventListener('click', () => sendMessage(failedText));
  inputEl.addEventListener('input', updateComposer);
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault(); sendMessage();
    }
  });
  panel.addEventListener('pointerdown', e => {
    if (!e.target.closest('button, textarea, summary, a')) inputEl.blur();
  });
  root.querySelectorAll('[data-sms-i18n]').forEach(element => {
    element.textContent = t('materialSelector.' + element.dataset.smsI18n, element.textContent);
  });
  inputEl.placeholder = t('materialSelector.placeholder', 'E.g. AISI 1045 or EN 1.4301');
  messagesEl.setAttribute('aria-label', t('materialSelector.conversation', 'Material conversation'));
  root.dataset.smsInitialized = 'true';
  const welcome = TXT.initialMaterialSelectorMessage;
  updateComposer();
  conversation.push({ role: "assistant", content: welcome });
  setMaterialCategoryStatus();
} });
})(window);
