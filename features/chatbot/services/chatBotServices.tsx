const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINIAPI_KEY;
export async function getFamilyAIResponse(
  userMessage: string,
  chatHistory: any[],
) {
  try {
    const url = process.env.EXPO_PUBLIC_GEMINI_URL;
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const systemInstruction = {
      role: "user", // API sometimes prefers instruction as first message
      parts: [
        {
          text: "You are a helpful Family Assistant in the 'Family Todo' app. Help families manage tasks and bills or plan meal for today. Be polite, concise, and helpful.",
        },
      ],
    };

    // Chat History ko sahi format mein convert karna
    const contents = [
      systemInstruction,
      ...chatHistory, // Purani saari baatein
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    return "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
