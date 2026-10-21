// Camera + Gemini Vision tutorial
// Part 1 follows MDN "Taking still photos with getUserMedia()":
//   start the camera, draw a video frame onto a canvas, turn it into an image.
// Part 2 follows the Gemini API "Image understanding" guide:
//   send the image as inline base64 data with a text prompt and read response.text.

import { GoogleGenAI } from "@google/genai";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const photo = document.getElementById("photo");
const startBtn = document.getElementById("startBtn");
const snapBtn = document.getElementById("snapBtn");
const askBtn = document.getElementById("askBtn");
const result = document.getElementById("result");
const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const promptInput = document.getElementById("prompt");

let stream = null;
let imageBase64 = null;

// ---------- Part 1: camera (MDN tutorial) ----------
startBtn.addEventListener("click", async () => {
  try {
    // Ask for the back camera on phones; fall back to any camera on laptops.
    stream = await navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
    video.srcObject = stream;
    await video.play();
    video.hidden = false;
    photo.hidden = true;
    snapBtn.disabled = false;
    result.textContent = "Camera is on. Point it at a product and take a photo.";
  } catch (err) {
    result.textContent = "Could not open the camera: " + err.message +
      "\n(Camera needs https:// or localhost, and you must allow permission.)";
  }
});

snapBtn.addEventListener("click", () => {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;
  // Keep the image small so the request is fast.
  const scale = Math.min(1, 768 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  imageBase64 = dataUrl.split(",")[1]; // strip "data:image/jpeg;base64,"
  photo.src = dataUrl;
  photo.hidden = false;
  video.hidden = true;
  askBtn.disabled = false;
  result.textContent = "Photo taken. Press 'Ask Gemini'.";
});

// ---------- Part 2: Gemini image understanding ----------
askBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim() || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    result.textContent = "Add an API key first (paste it above or put it in .env.local).";
    return;
  }
  if (!imageBase64) return;

  askBtn.disabled = true;
  result.textContent = "Asking Gemini...";
  const started = performance.now();

  const primaryModel = modelInput.value.trim() || "gemini-3.5-flash-lite";
  const candidates = [primaryModel, "gemini-3.5-flash-lite", "gemini-3.7-flash"].filter(
    (m, i, arr) => m && arr.indexOf(m) === i
  );

  let lastErr = null;
  for (const modelName of candidates) {
    try {
      if (modelName !== primaryModel) {
        result.textContent = `Retrying with ${modelName} due to server demand...`;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: promptInput.value },
        ],
      });
      const secs = ((performance.now() - started) / 1000).toFixed(1);
      const note = modelName !== primaryModel ? `\n\n(Note: Automatically switched to ${modelName} because ${primaryModel} was under high server demand)` : "";
      result.textContent = response.text + `\n\n(answered in ${secs} s using ${modelName})${note}`;
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Model ${modelName} failed:`, err);
    }
  }

  result.textContent = "Gemini request failed: " + (lastErr ? lastErr.message : "Unknown error");
  askBtn.disabled = false;
});
