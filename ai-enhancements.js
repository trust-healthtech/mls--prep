/* TRUST HEALTH TECH AI enhancements: memory, persistent chat history, and voice input. */
(function () {
    "use strict";

    const HISTORY_KEY = "trust_ai_chat_history_v2";
    const MEMORY_KEY = "trust_ai_memory_v2";
    const MAX_MESSAGES = 40;
    const MAX_MEMORY_ITEMS = 12;
    let aiHistory = loadJson(HISTORY_KEY, []);
    let aiMemory = loadJson(MEMORY_KEY, []);

    function loadJson(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "null");
            return Array.isArray(value) ? value : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function saveState() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(aiHistory.slice(-MAX_MESSAGES)));
        localStorage.setItem(MEMORY_KEY, JSON.stringify(aiMemory.slice(-MAX_MEMORY_ITEMS)));
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        }[character]));
    }

    function createChatControls() {
        const box = document.getElementById("aiChatBox");
        const input = document.getElementById("aiQueryText");
        if (!box || !input || document.getElementById("trustAiHistory")) return;

        box.innerHTML = "<div id=\"trustAiHistory\" aria-live=\"polite\"></div>";
        box.style.maxHeight = "360px";
        box.style.overflowY = "auto";

        const controls = document.createElement("div");
        controls.id = "trustAiControls";
        controls.style.cssText = "display:flex;gap:6px;margin:8px 0;flex-wrap:wrap";
        controls.innerHTML = `
            <button type="button" class="btn btn-blue" id="trustAiVoice" style="width:auto;padding:7px 10px;font-size:.72rem">🎙️ Voice</button>
            <button type="button" class="btn btn-red" id="trustAiClear" style="width:auto;padding:7px 10px;font-size:.72rem">Clear chat</button>
            <button type="button" class="btn btn-green" id="trustAiForget" style="width:auto;padding:7px 10px;font-size:.72rem">Forget memory</button>`;
        input.parentElement.insertAdjacentElement("afterend", controls);

        document.getElementById("trustAiClear").onclick = () => {
            aiHistory = [];
            saveState();
            renderHistory();
        };
        document.getElementById("trustAiForget").onclick = () => {
            aiMemory = [];
            saveState();
            renderHistory();
        };
        document.getElementById("trustAiVoice").onclick = startVoiceInput;
        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                window.runAiInquiry();
            }
        });
        renderHistory();
    }

    function renderHistory() {
        const historyBox = document.getElementById("trustAiHistory");
        if (!historyBox) return;
        if (!aiHistory.length) {
            historyBox.innerHTML = "<div style='opacity:.8'>Trust AI remembers this conversation on this device. Ask a question to begin.</div>";
            return;
        }
        historyBox.innerHTML = aiHistory.map(item => `
            <div style="margin:0 0 10px;padding:8px;border-radius:7px;background:${item.role === "user" ? "#1e40af" : "#1e293b"}">
                <strong style="font-size:.68rem;color:#93c5fd">${item.role === "user" ? "YOU" : "TRUST AI"}</strong>
                <div style="white-space:pre-wrap;margin-top:3px">${escapeHtml(item.content)}</div>
            </div>`).join("");
        const box = document.getElementById("aiChatBox");
        box.scrollTop = box.scrollHeight;
    }

    function rememberQuestion(question) {
        const lower = question.toLowerCase();
        const match = lower.match(/(?:my name is|call me|i am|i'm)\s+([a-z][a-z '-]{1,40})/i);
        if (match) {
            const memory = "The learner's name is " + match[1].trim() + ".";
            if (!aiMemory.includes(memory)) aiMemory.push(memory);
        }
        if (/prefer|i like|my goal|i study|i am studying/i.test(question)) {
            if (!aiMemory.includes(question)) aiMemory.push(question);
        }
        aiMemory = aiMemory.slice(-MAX_MEMORY_ITEMS);
    }

    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const input = document.getElementById("aiQueryText");
        const button = document.getElementById("trustAiVoice");
        if (!SpeechRecognition) {
            input.placeholder = "Voice input is not supported in this browser";
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        button.textContent = "🎙️ Listening...";
        recognition.onresult = event => {
            input.value = event.results[0][0].transcript;
            window.runAiInquiry();
        };
        recognition.onerror = () => { button.textContent = "🎙️ Voice"; };
        recognition.onend = () => { button.textContent = "🎙️ Voice"; };
        recognition.start();
    }

    const originalInquiry = window.runAiInquiry;
    window.runAiInquiry = async function () {
        const input = document.getElementById("aiQueryText");
        if (!input) return;
        const question = input.value.trim();
        if (!question) return;
        aiHistory.push({ role: "user", content: question });
        rememberQuestion(question);
        saveState();
        renderHistory();
        input.value = "";

        const box = document.getElementById("aiChatBox");
        box.insertAdjacentHTML("beforeend", "<div style='opacity:.8;margin-bottom:8px'>Trust AI is thinking...</div>");
        box.scrollTop = box.scrollHeight;

        const apiKey = localStorage.getItem("trust_ai_api_key");
        if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
            try {
                const messages = [
                    { role: "system", content: "You are Trust AI, a careful Medical Laboratory Science tutor. Use the learner memory when relevant: " + aiMemory.join(" | ") },
                    ...aiHistory.slice(-12).map(item => ({ role: item.role, content: item.content }))
                ];
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
                    body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: .4, max_tokens: 500 })
                });
                if (!response.ok) throw new Error("AI request failed");
                const data = await response.json();
                const answer = data.choices?.[0]?.message?.content?.trim();
                if (!answer) throw new Error("Empty AI response");
                aiHistory.push({ role: "assistant", content: answer });
            } catch (_) {
                aiHistory.push({ role: "assistant", content: "The online AI is unavailable right now.\n\n" + (typeof buildAiFallbackAnswer === "function" ? buildAiFallbackAnswer(question) : "Please try again shortly.") });
            }
        } else {
            aiHistory.push({ role: "assistant", content: typeof buildAiFallbackAnswer === "function" ? buildAiFallbackAnswer(question) : "Please configure the AI service first." });
        }
        aiHistory = aiHistory.slice(-MAX_MESSAGES);
        saveState();
        renderHistory();
    };

    window.addEventListener("DOMContentLoaded", createChatControls);
    if (document.readyState !== "loading") createChatControls();
})();
