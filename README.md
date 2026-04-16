# VoxFlow 🎙️✨

**Your Voice-Powered Knowledge OS** *Built for HackBlr 2025 | Problem Statement 1: Voice-First Knowledge & Workflow Agent*

VoxFlow is a voice-native intelligence layer that unifies fragmented information into a single, conversational interface. By combining real-time voice interaction with semantic episodic memory, VoxFlow allows users to access, understand, and act on complex knowledge without breaking their deep-work flow.

## 🚀 Live Demo
**[voxfloww.netlify.app](https://voxfloww.netlify.app/)**

---

## 💡 The Vision
In modern organizations, information is trapped in silos—docs, chats, and codebases—leading to constant context switching and mental fatigue. 

> **"We are solving the broader problem of knowledge fragmentation and cognitive load using Vapi for interaction and Qdrant for episodic memory."**

VoxFlow transforms the "search-and-read" bottleneck into a "speak-and-understand" workflow.

---

## 🌟 Key Capabilities
* **🎙️ Voice-First Interaction:** Powered by Vapi for ultra-low latency STT/TTS, providing a natural, human-like conversational experience.
* **🧠 Episodic Memory:** Leverages Qdrant to maintain context across sessions. VoxFlow doesn't just answer; it remembers your past queries and learned preferences.
* **📄 Instant Ingestion:** Drag-and-drop PDF or Markdown support. Information is chunked, embedded, and vectorized into the knowledge base in real-time.
* **📊 Agent Dashboard:** A high-end React UI featuring animated waveforms and visual "Answer Cards" to supplement voice responses.

---

## 🛠️ Technical Architecture
VoxFlow is engineered with a production-ready stack:
* **Voice Interaction:** [Vapi.ai](https://vapi.ai) handles the real-time audio stream and intent capture.
* **Vector Database:** [Qdrant](https://qdrant.tech) serves as the long-term "Memory Layer" for semantic retrieval and episodic recall.
* **Reasoning Engine:** [Claude 3.5 Sonnet](https://anthropic.com) synthesizes multi-source data into concise, actionable answers.
* **Frontend:** Built with **React + Vite** and styled with **Tailwind CSS** for a sleek, high-performance DX.

---

## 🛠️ Installation & Local Setup

1. **Clone the repository:**
   git clone [https://github.com/marushikashukla/Vox-Flow.git](https://github.com/marushikashukla/Vox-Flow.git)
   cd Vox-Flow

2. **Install dependencies:**
   npm install

3. **Environment Configuration:**
   Create a .env file in the root directory and add your credentials:
   VITE_VAPI_PUBLIC_KEY=your_vapi_key
   VITE_QDRANT_URL=your_qdrant_url
   VITE_QDRANT_API_KEY=your_qdrant_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key

4. **Run Development Server:**
   npm run dev

---

## 🏆 Why VoxFlow ?
VoxFlow reimagines the "Knowledge Agent" by focusing on **Flow**. It fulfills every requirement of Problem Statement 1 by retrieving knowledge, maintaining session context, and enabling faster decision-making through a hands-free, voice-native interface.

**Developed With ❤️ by Marushika |HackBlr2026**

***
