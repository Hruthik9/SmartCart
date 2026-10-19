# Tutorial: Camera + Gemini Vision (HCI Milestone 1)

This folder holds the code our team wrote while following tutorials on the core technology behind SmartCart: taking a photo with the device camera in a web page and asking Google Gemini what product is in it. It is separate from the main SmartCart app in the repository root.

## Where the code came from

We combined two tutorials:

1. **MDN Web Docs, "Taking still photos with getUserMedia()"**
   https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos
   Used for: starting the camera with `getUserMedia`, showing it in a `<video>`, and drawing a frame onto a `<canvas>` to get a JPEG.
2. **Google AI for Developers, Gemini API "Image understanding"**
   https://ai.google.dev/gemini-api/docs/generate-content/image-understanding
   Used for: sending the image as inline base64 data with a text prompt using the `@google/genai` JavaScript SDK, and reading `response.text`. (Tutorial code samples are Apache 2.0 licensed.)

### What we changed from the tutorials

1. The MDN sample uses the default camera; we ask for the back camera first (`facingMode: "environment"`) and fall back to any camera, so it works on phones and laptops.
2. The Gemini sample is Node.js and reads an image file from disk; we run it in the browser and send the photo we just took from the canvas instead.
3. The photo is scaled down to 768 px on its longest side before sending, to keep requests fast.
4. Added a prompt box, a model box, and a timer so we can try different prompts and see how long each answer takes.
5. Packaged it as a small Vite project so the SDK installs with npm.

## How to run it

Requirements: Node.js 18+ and a free Gemini API key from https://aistudio.google.com/apikey

```bash
cd tutorial/gemini-camera-vision
npm install
cp .env.example .env.local     # then paste your key into .env.local (optional)
npm run dev
```

Open http://localhost:5173 in Chrome or Safari, then:

1. Press **Start camera** and allow camera access.
2. Point the camera at a product and press **Take photo**.
3. Press **Ask Gemini**. The answer and the response time appear under "Result".

If you don't use `.env.local`, paste the key into the API key box on the page instead. The key is only kept in the page while it is open.

**Note on phones:** browsers only allow the camera on `https://` pages or on `localhost`. To try it on a phone, open it on a laptop first, or deploy the `dist/` folder from `npm run build` to an HTTPS host (we use Netlify for the main app).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout: camera view, buttons, prompt, result |
| `main.js` | Camera capture (MDN tutorial) and Gemini request (Gemini tutorial) |
| `style.css` | Simple mobile-friendly styling |
| `.env.example` | Template for the API key file (the real `.env.local` is git-ignored) |

## What we learned for SmartCart

1. Camera access needs HTTPS and inline video playback (`playsinline`) on iPhone Safari.
2. Gemini can name most packaged products from one photo, even when the barcode is not visible.
3. Shrinking the photo before sending keeps each request small, which matters on weak in-store Wi-Fi.
4. API keys must never be committed; this project reads the key from `.env.local` or the page.
