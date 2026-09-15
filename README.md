# SmartCart 🛒
### Ambient AI Retail & Grocery Assistant for Human-Computer Interaction (HCI) Research

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Multimodal_Vision-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![PWA](https://img.shields.io/badge/PWA-iOS_Safari_Ready-5A67D8?logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

SmartCart is an iOS-style ambient AI retail assistant designed to empower physical store shoppers with real-time product intelligence, Nutri-Score transparency, 1-tap budget swaps, and hands-free voice assistance.

---

## 🌟 Key Highlights

- 📷 **Apple Minimalist Viewfinder**: Clean dark vignette focus zone, subtle white corner ticks, and optical shutter button replacing noisy green scanning lasers.
- 📸 **Live Photo Capture & Shutter Flash**: Captures real-time camera snapshots with mechanical shutter sound and screen flash animation.
- 🗂️ **Persistent Scanned Snaps Session**: Automatically stores all scanned photos and items into a session list (`localStorage`), decoupling scanning from active cart commitment.
- 🛒 **Scanned Items Session Drawer**: Slide-up iOS drawer to review photos one-by-one, inspect details, and move individual or all items into the cart in 1 tap.
- 🏬 **Universal Department Store & Mart AI**: Recognizes any item from groceries to tech accessories, cleaning supplies, and personal care (Walmart, Target, CVS, Costco).
- 🔄 **1-Tap Smart Swaps**: Instant recommendations for healthier foods or high-value store-brand alternatives (**Great Value, Equate, onn., up & up**) with calculated dollar savings.
- 🏝️ **Dynamic Island Simulation**: Fluidly morphs to communicate scan confirmations, swap savings, budget warnings, and voice input.
- 🎙️ **Hands-Free Voice Assistant**: Add items, ask budget headroom, and query swaps using natural speech.
- 📱 **Progressive Web App (PWA)**: Full-screen native experience on iOS Safari with home screen installation and offline asset caching.

---

## 📚 Project Documentation

- **[Project Walkthrough & HCI Report (`PROJECT_WALKTHROUGH.md`)](./PROJECT_WALKTHROUGH.md)**: Full chronological evolution from inception to present, design rationale, feature catalog, and user testing instructions.
- **[Technical Architecture Checkpoint (`CHECKPOINT.md`)](./CHECKPOINT.md)**: State management models, hardware camera constraints, Web Audio synthesizer parameters, and API contracts.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/Hruthik9/SmartCart.git
cd SmartCart

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📱 Testing on iPhone (PWA)

1. Open the deployed application URL in **Safari** on your iPhone.
2. Tap the **Share** icon in the Safari toolbar.
3. Select **"Add to Home Screen"** and tap **"Add"**.
4. Launch **SmartCart** from your home screen for the full edge-to-edge native app experience.

---

## 📄 License
Academic and research use for Masters in HCI.
