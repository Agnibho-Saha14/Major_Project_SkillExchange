import { useState, useEffect, useRef } from "react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SKILLS_API = "http://localhost:5000/api/skills/chatbot-context";

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! 👋 Ask me anything about skills or courses on this platform." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [skillsContext, setSkillsContext] = useState("");
  const bottomRef = useRef(null);

  // Fetch all skills once when chatbot first opens
useEffect(() => {
  if (open && !skillsContext) {
    fetch(SKILLS_API)
      .then(r => r.json())
      .then(skills => {

        // 🔹 Sort skills by rating (highest first)
        const sortedSkills = [...skills].sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
        );

        // 🔹 Create AI context from sorted skills
        const summary = sortedSkills.map((s, i) => `
Skill ${i + 1}
Title: ${s.title}
Category: ${s.category}
Level: ${s.level}
Instructor: ${s.instructor}

Description: ${s.description}

Duration: ${s.duration}
Time Per Week: ${s.timePerWeek}

Payment Option: ${s.paymentOptions}
Exchange Skill: ${s.exchangeFor || "None"}

Average Rating: ${s.averageRating || 0}
Total Ratings: ${s.totalRatings || 0}

Tags: ${(s.tags || []).join(", ")}
`).join("\n");

        setSkillsContext(summary);
      })
      .catch(() => setSkillsContext("Could not load skills data."));
  }
}, [open]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

   const systemPrompt = `
You are an AI assistant for a Skill Exchange learning platform.

Users can:
• Learn skills by paying money
• Exchange their own skills to learn from others

You have TWO responsibilities:

1️⃣ PLATFORM ASSISTANT  
When the user asks about courses, skills, ratings, instructors, categories, beginner skills, or recommendations,
use the platform data below.

2️⃣ GENERAL AI ASSISTANT  
If the user asks general questions (definitions, explanations, learning advice, etc.),
you can answer using your own knowledge like a normal AI.

Examples:
- "Top rated skills" → Use platform data
- "Beginner skills" → Use platform data
- "What is fighting?" → Answer normally
- "Explain AI" → Answer normally

Platform Skills Data:
${skillsContext}

Guidelines:
• Recommend skills when relevant
• Be helpful and friendly
• If a user asks about a specific skill in the platform, show its details
• If the question is general knowledge, answer normally like Gemini
`;
    const history = messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      }));

    const body = {
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMsg }] }
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "#6c47ff", color: "#fff", fontSize: "24px",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px", zIndex: 9999,
          width: "360px", height: "500px", background: "#fff",
          borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "sans-serif"
        }}>
          {/* Header */}
          <div style={{ background: "#6c47ff", color: "#fff", padding: "14px 18px", fontWeight: "bold", fontSize: "15px" }}>
            🤖 SkillBot — Ask about any course!
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#6c47ff" : "#f0f0f0",
                color: m.role === "user" ? "#fff" : "#222",
                padding: "8px 12px", borderRadius: "12px",
                maxWidth: "80%", fontSize: "13.5px", lineHeight: "1.5",
                whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "#f0f0f0", padding: "8px 12px", borderRadius: "12px", fontSize: "13px", color: "#888" }}>
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", borderTop: "1px solid #eee", padding: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about a course..."
              style={{
                flex: 1, border: "1px solid #ddd", borderRadius: "8px",
                padding: "8px 10px", fontSize: "13px", outline: "none"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                marginLeft: "6px", background: "#6c47ff", color: "#fff",
                border: "none", borderRadius: "8px", padding: "8px 14px",
                cursor: "pointer", fontSize: "13px"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}