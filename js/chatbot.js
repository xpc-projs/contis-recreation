
(function () {
  "use strict";

  // Chat content
  const responses = [
    {
      keywords: ["menu", "menus", "product", "products", "cake", "cakes", "food", "pasta", "pizza"],
      answer:
        "You can browse our available products through the Menu section. " +
        "Choose a category to explore the products."
    },
    {
      keywords: ["branch", "branches", "store", "stores", "location", "locations", "address", "addresses"],
      answer:
        "You can check our available store locations through the Branches " +
        "or Store Locator section of this website."
    },
    {
      keywords: ["delivery", "deliver", "delivers", "shipping"],
      answer:
        "Please check the ordering and delivery information on our website. " +
        "Delivery availability may depend on your location."
    },
    {
      keywords: ["order", "orders", "ordering", "checkout", "check out", "buy"],
      answer:
        "To try the ordering demo, browse the Menu, add a product to your " +
        "cart, and proceed to checkout. This is a demonstration only; " +
        "no real order will be submitted."
    },
    {
      keywords: ["payment", "payments", "pay", "credit card", "credit cards"],
      answer:
        "The checkout on this academic recreation is a demonstration. " +
        "It does not process real payments. Please do not enter actual " +
        "payment details."
    },
    {
      keywords: ["account", "login", "log in", "register", "password"],
      answer:
        "The account features are for demonstration purposes and do not " +
        "provide real customer authentication."
    },
    {
      keywords: ["contact", "help", "customer service", "support"],
      answer:
        "Please visit the Contact or FAQ section of the website for " +
        "the available customer information."
    },
    {
      keywords: ["thank", "thanks"],
      answer: "You're welcome! Thank you for visiting Conti's."
    },
    {
      keywords: ["hello", "hi", "good morning", "good afternoon"],
      answer:
        "Hello! Welcome to Conti's. How can I help you today?"
    }
  ];

  const suggestions = [
    "Show me the menu",
    "Find a branch",
    "How do I order?",
    "Delivery information",
    "Payment information"
  ];

  // Widget markup
  const chatbotMarkup = `
      <section id="contis-chatbot-panel"
               role="dialog"
               aria-label="Conti's customer assistant"
               aria-hidden="true">

        <header class="chatbot-header">
          <div>
            <strong>Conti's Assistant</strong>
            <small>How can we help you?</small>
          </div>
          <button id="contis-chatbot-close"
                  type="button"
                  aria-label="Close chat">&times;</button>
        </header>

        <div class="chatbot-messages"
             id="contis-chatbot-messages"
             aria-live="polite">
        </div>

        <div class="chatbot-prompts">
          <button id="contis-chatbot-suggestions-toggle"
                  type="button"
                  aria-expanded="true"
                  aria-controls="contis-chatbot-suggestions">Suggested questions</button>
          <div class="chatbot-suggestions"
               id="contis-chatbot-suggestions"></div>
        </div>

        <form class="chatbot-input-area"
              id="contis-chatbot-form">
          <input id="contis-chatbot-input"
                 type="text"
                 placeholder="Type your message..."
                 aria-label="Your message"
                 autocomplete="off"
                 maxlength="300"
                 required>
          <button id="contis-chatbot-send"
                  type="submit">Send</button>
        </form>
      </section>

      <button id="contis-chatbot-toggle"
              type="button"
              aria-label="Open Conti's chat"
              aria-controls="contis-chatbot-panel"
              aria-expanded="false">
        <svg viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.7"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true">
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/>
          <path d="M8 11h.01M12 11h.01M16 11h.01"/>
        </svg>
      </button>
  `;

  function getResponse(message) {
    const words = message.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    const normalized = ` ${words.join(" ")} `;
    const match = responses.find(item =>
      item.keywords.some(keyword => normalized.includes(` ${keyword} `))
    );

    return match
      ? match.answer
      : "I'm sorry, I don't have an answer for that yet. " +
        "Please try asking about our menu, branches, ordering, " +
        "delivery, or payment information.";
  }

  function mountChatbot() {
    if (document.getElementById("contis-chatbot")) return;

    const container = document.createElement("div");
    container.id = "contis-chatbot";
    container.innerHTML = chatbotMarkup;

    const panel = container.querySelector("#contis-chatbot-panel");
    const toggle = container.querySelector("#contis-chatbot-toggle");
    const close = container.querySelector("#contis-chatbot-close");
    const messages = container.querySelector("#contis-chatbot-messages");
    const input = container.querySelector("#contis-chatbot-input");
    const form = container.querySelector("#contis-chatbot-form");
    const suggestionToggle = container.querySelector("#contis-chatbot-suggestions-toggle");
    const suggestionArea = container.querySelector("#contis-chatbot-suggestions");
    const viewport = window.visualViewport;

    function setSuggestionsOpen(open) {
      suggestionArea.hidden = !open;
      suggestionToggle.setAttribute("aria-expanded", String(open));
    }

    function updateChatViewport() {
      const bottomInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      container.classList.toggle("chatbot-compact", viewport.height < 400);
      container.style.setProperty("--chatbot-viewport-height", `${viewport.height}px`);
      container.style.setProperty("--chatbot-viewport-inset", `${bottomInset}px`);
    }

    function addMessage(text, sender) {
      const message = document.createElement("div");
      message.className = `chatbot-message ${sender}`;

      // Use textContent to prevent user input from being interpreted as HTML.
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage(message) {
      const cleanMessage = message.trim();
      if (!cleanMessage) return;

      if (suggestionArea.contains(document.activeElement)) suggestionToggle.focus();
      setSuggestionsOpen(false);
      addMessage(cleanMessage, "user");
      input.value = "";

      // Simple local response; no external API is used.
      window.setTimeout(() => {
        addMessage(getResponse(cleanMessage), "bot");
      }, 350);
    }

    function openChat() {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      if (viewport) {
        updateChatViewport();
        viewport.addEventListener("resize", updateChatViewport);
        viewport.addEventListener("scroll", updateChatViewport);
      }
      input.focus();
    }

    function closeChat() {
      panel.classList.remove("is-open");
      toggle.focus();
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      if (viewport) {
        viewport.removeEventListener("resize", updateChatViewport);
        viewport.removeEventListener("scroll", updateChatViewport);
        container.classList.remove("chatbot-compact");
        container.style.removeProperty("--chatbot-viewport-height");
        container.style.removeProperty("--chatbot-viewport-inset");
      }
    }

    toggle.addEventListener("click", openChat);
    close.addEventListener("click", closeChat);
    suggestionToggle.addEventListener("click", () => {
      setSuggestionsOpen(suggestionArea.hidden);
    });
    container.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !panel.classList.contains("is-open")) return;
      event.preventDefault();
      closeChat();
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage(input.value);
    });

    suggestions.forEach(suggestion => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = suggestion;

      button.addEventListener("click", () => {
        sendMessage(suggestion);
      });

      suggestionArea.appendChild(button);
    });

    addMessage(
      "Hello! Welcome to Conti's. I can help you explore the menu, " +
      "find branches, and learn how to use this website.",
      "bot"
    );
    document.body.appendChild(container);
  }

  // Wait until the page is ready before inserting the chatbot.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChatbot, { once: true });
  } else {
    mountChatbot();
  }
})();
