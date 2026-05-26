const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINIAPI_KEY;

export async function extractDateFromBill(base64Data: string) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    // Gemini 3 Flash ke liye ye URL use karein:
    //  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Task: Look at this bill. Extract ONLY the due date or any date found from this image. Output format: Date: [YYYY-MM-DD]. If no date is found or the image is not a bill, strictly return 'NO_DATE_FOUND'. Do not provide any other text.",
              },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      // Hum error code aur message dono bhejenge
      const errorMessage = `${data.error.code}: ${data.error.message}`;

      if (data.error.code === 404) throw new Error("MODEL_NOT_FOUND");
      if (data.error.code === 429) throw new Error("QUOTA_EXCEEDED");

      throw new Error(errorMessage); // Asli message UI ko milega
    }
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text.trim();
      console.log("AI Raw Text:", aiText); // Debugging ke liye

      if (aiText.includes("NO_DATE_FOUND")) {
        return "NO_DATE_FOUND";
      }

      return aiText; // Ye return karega "Date: 2026-04-08"
    }
  } catch (error: any) {
    // Sirf console pe dikhaye, return kuch na karein taake UI catch mein jaye
    console.log("Service Layer Error:", error.message);
    throw error;
  }
}
