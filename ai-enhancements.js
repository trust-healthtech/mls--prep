/* TRUST HEALTH TECH AI enhancements: Gemini 2.5 Flash, memory, persistent chat history, voice input, and mobile UI fixes. */
(function () {
    "use strict";

    const HISTORY_KEY = "trust_ai_chat_history_v2";
    const MEMORY_KEY = "trust_ai_memory_v2";
    const GEMINI_KEY = "trust_gemini_api_key";
    const MAX_MESSAGES = 40;
    const MAX_MEMORY_ITEMS = 12;
    const MAX_CONTEXT_MESSAGES = 16;
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

    function installUiFixes() {
        if (document.getElementById("trustAiUiFixes")) return;

        const style = document.createElement("style");
        style.id = "trustAiUiFixes";
        style.textContent = `
            .pill-row {
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                scrollbar-width: thin;
                -webkit-overflow-scrolling: touch;
            }
            .pill-chip {
                flex: 0 0 auto !important;
                min-height: 42px;
                font-size: .78rem !important;
                font-weight: 800 !important;
            }
            .ads-native-banner {
                background: linear-gradient(135deg, #dcfce7, #bbf7d0, #ecfdf5) !important;
                border: 2px solid #86efac !important;
                border-radius: 14px !important;
                color: #14532d !important;
                font-size: .82rem !important;
                font-weight: 800 !important;
                box-shadow: 0 4px 12px rgba(34,197,94,.22);
                animation: trustSponsoredGlow 2.8s ease-in-out infinite;
            }
            .ads-native-banner a {
                display: block;
                color: #166534 !important;
                font-size: .92rem !important;
                font-weight: 800 !important;
                line-height: 1.35;
            }
            .ads-native-banner:active { transform: scale(.97); }
            @keyframes trustSponsoredGlow {
                0%, 100% { box-shadow: 0 4px 12px rgba(34,197,94,.22); }
                50% { box-shadow: 0 0 20px rgba(74,222,128,.65); }
            }
        `;
        document.head.appendChild(style);

        const statCards = document.querySelectorAll(".stats-wrapper .stat-card");
        if (statCards[2]) {
            statCards[2].onclick = null;
            statCards[2].removeAttribute("onclick");
        }

        const challengeButton = document.getElementById("submitChallengeBtn");
        if (challengeButton) {
            challengeButton.onclick = function (event) {
                event.preventDefault();
                const answer = document.getElementById("challengeTextarea")?.value || "";
                if (!answer.trim()) {
                    alert("Please type your answer first!");
                    return false;
                }
                const question = "What is the normal human arterial blood pH range? Explain 2 causes of metabolic acidosis and how the body compensates.";
                const whatsappLink = "https://chat.whatsapp.com/FFjZ6gEPWn0KBngsqogAvN?text=" + encodeURIComponent("Lab Challenge #104 Submission\n\nQuestion: " + question + "\n\nMy Answer:\n" + answer);
                window.open(whatsappLink, "_blank");
                return false;
            };
        }
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
        const match = question.match(/(?:my name is|call me|i am|i'm)\s+([a-z][a-z '-]{1,40})/i);
        if (match) {
            const memory = "The learner's name is " + match[1].trim() + ".";
            if (!aiMemory.includes(memory)) aiMemory.push(memory);
        }
        if (/prefer|i like|my goal|i study|i am studying/i.test(question) && !aiMemory.includes(question)) {
            aiMemory.push(question);
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

    function getGeminiContents() {
        return aiHistory.slice(-MAX_CONTEXT_MESSAGES).map(item => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }]
        }));
    }

    async function requestGemini(question, apiKey) {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: [
                            "You are Trust AI, an expert Medical Laboratory Science tutor.",
                            "Answer the learner's complete question, not only keywords.",
                            "Give accurate, useful explanations with definitions, mechanisms, laboratory procedures, interpretation, reference ranges, causes, calculations, and exam tips when relevant.",
                            "Use clear headings and bullet points for long answers.",
                            "Never mention or address the learner as CEO.",
                            "Do not invent patient-specific diagnoses. Remind users that educational information does not replace qualified clinical advice.",
                            "Learner memory: " + (aiMemory.join(" | ") || "No saved memory.")
                        ].join(" ") }]
                    },
                    contents: getGeminiContents(),
                    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 }
                })
            }
        );
        if (!response.ok) throw new Error("Gemini request failed");
        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
        if (!answer) throw new Error("Empty Gemini response");
        return answer;
    }

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

        const apiKey = localStorage.getItem(GEMINI_KEY);
        let answer;
        if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
            try {
                answer = await requestGemini(question, apiKey);
            } catch (_) {
                answer = "Gemini is unavailable right now.\n\n" + (typeof buildAiFallbackAnswer === "function" ? buildAiFallbackAnswer(question) : "Please try again shortly.");
            }
        } else {
            answer = typeof buildAiFallbackAnswer === "function"
                ? buildAiFallbackAnswer(question)
                : "Please configure your Gemini API key first.";
        }

        aiHistory.push({ role: "assistant", content: answer });
        aiHistory = aiHistory.slice(-MAX_MESSAGES);
        saveState();
        renderHistory();
    };

    window.addEventListener("DOMContentLoaded", () => {
        installUiFixes();
        createChatControls();
    });
    if (document.readyState !== "loading") {
        installUiFixes();
        createChatControls();
    }
})();
