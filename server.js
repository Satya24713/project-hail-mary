import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/messages", async (req, res) => {
  try {
    const requestedModel = "openai/gpt-oss-120b";
    console.log(`Receiving message for model: ${requestedModel}`);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: req.body.messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NVIDIA API Error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({ error: `NVIDIA API Error: ${errorText}` });
    }

    const data = await response.json();

    res.json({
      content: [
        {
          type: "text",
          text: data.choices?.[0]?.message?.content || "..."
        }
      ]
    });

  } catch (error) {
    console.error("Backend caught an error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// Serve the static React buildup
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server and API running on port ${PORT}`);
});
