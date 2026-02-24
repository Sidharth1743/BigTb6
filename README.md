# TB Diagnostic Assistant - Gemini Live

A real-time multimodal AI health companion using Google's Gemini Live API for TB (Tuberculosis) screening with cough audio, palm/eye/nail imagery, and chest X‑ray analysis.

## Features

- **Real-time Voice Conversation**: Talk to Dr. AI through your microphone
- **Cough Analysis**: Record cough audio and get TB probability via external API
- **Palm Analysis**: Capture palm image and run anemia screening
- **Eye Analysis**: Capture lower‑eyelid image and run anemia screening
- **Fingernail Analysis**: Capture fingernail image and run anemia screening
- **Chest X‑ray Analysis**: Upload X‑ray images and run TB screening
- **WebRTC Streaming**: Low-latency audio/video communication
- **Tool Integration**: Gemini Live function calling for multimodal tools
- **Saved Outputs**: Media and analysis JSON files are saved alongside captures

## Prerequisites

- Python 3.12+
- Node.js 18+
- Google API Key (for Gemini Live)
- Daily.co API Key (for WebRTC)

## Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd GEMINI_LIVE

# Setup backend virtual environment
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup frontend
cd ../client
npm install
```

### 2. Configure API Keys

Create a `.env` file in the `server` directory:

```bash
# server/.env
GOOGLE_API_KEY=your_google_api_key_here
DAILY_API_KEY=your_daily_api_key_here
```

**Getting API Keys:**
- **Google API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Daily.co API Key**: Get from [Daily.co Dashboard](https://dashboard.daily.co/)

## Running the Application

### Terminal 1 - Bot (WebRTC)

```bash
cd server
./venv/bin/python bot.py -t webrtc --host localhost --port 7860
```

### Terminal 2 - Backend API (Upload + Room)

```bash
cd server
./venv/bin/python main.py
```

### Terminal 3 - Frontend

```bash
cd client
npm run dev
```

### Access the Application

1. Open http://localhost:3000 in your browser
2. Grant microphone and camera permissions
3. Click "Start Consultation"
4. Use the "Chest X‑ray Upload" panel to upload an X‑ray image when needed

## How It Works

### Conversation Flow

1. **Greeting**: Dr. AI introduces itself and asks how you're feeling
2. **Symptom Inquiry**: Ask questions about TB-related symptoms
3. **Cough Analysis**: When you mention a cough, the bot records and analyzes the cough audio
4. **Palm/Eye/Nail Analysis**: When you mention these concerns, the bot captures an image and returns an analysis in the same tool call
5. **Chest X‑ray Analysis**: After uploading an X‑ray, ask the bot to analyze the chest X‑ray

### Tools

| Tool | Description |
|------|-------------|
| `record_cough_sound` | Records user's cough audio |
| `analyze_cough_for_tb` | Analyzes recorded cough for TB probability |
| `capture_palm_photo` | Captures palm image and returns analysis |
| `capture_eye_photo` | Captures eye image and returns analysis |
| `capture_fingernail_photo` | Captures fingernail image and returns analysis |
| `analyze_chest_xray` | Analyzes most recently uploaded chest X‑ray |

### Architecture

```
┌─────────────┐     WebRTC      ┌─────────────┐
│   Client    │ ◄──────────────► │   Backend   │
│  (Browser)  │                 │ (Python)    │
└─────────────┘                 └─────────────┘
                                        │
                                        ▼
                               ┌─────────────┐
                               │ Gemini Live │
                               │    API      │
                               └─────────────┘
                                        │
                                        ▼
                               ┌─────────────┐
                               │  TB Audio   │
                               │  Analysis   │
                               │    API      │
                               └─────────────┘
```

## Project Structure

```
GEMINI_LIVE/
├── client/                 # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/        # React components
│   └── package.json      # Frontend dependencies
├── server/                # Python backend
│   ├── bot.py            # Main bot with Pipecat
│   ├── tb_audio_tool.py  # TB cough analysis API
│   ├── palm_anemia_tool.py  # Palm anemia API
│   ├── eye_anemia_tool.py   # Eye anemia API
│   ├── nail_anemia_tool.py  # Nail anemia API
│   ├── chest_xray_tool.py   # Chest X‑ray TB API
│   ├── xray_store.py     # Latest X‑ray path store
│   ├── main.py           # FastAPI server (upload + room)
│   ├── requirements.txt  # Python dependencies
│   └── venv/             # Virtual environment
├── docs/                  # Documentation
│   └── plans/            # Implementation plans
└── pipecat/              # Custom Pipecat fork
```

## Saved Outputs

- Cough: `server/cough_samples/*.wav` and `*_analysis.json`
- Palm: `server/palm_captures/*.png` and `*_analysis.json`
- Eye: `server/eye_images/*.png` and `*_analysis.json`
- Nail: `server/fingernail_images/*.png` and `*_analysis.json`
- X‑ray: `server/xray_images/*` and `*_analysis.json`

## Troubleshooting

### Port Already in Use

If you get "address already in use", specify a different port:

```bash
# Backend
./venv/bin/python bot.py -t webrtc --host localhost --port 7861
```

### Microphone Not Working

1. Grant microphone permissions in browser
2. Click "Enable Audio" button if audio doesn't play
3. Use headphones to prevent audio feedback

### API Key Errors

Ensure your `.env` file is correctly configured:
- No quotes around values
- No spaces around `=`
- Keys are correct (GOOGLE_API_KEY, DAILY_API_KEY)

## Development

### Running Tests

```bash
cd server
./venv/bin/python -m pytest tests/
```

### Customizing the Bot

Edit `server/bot.py` to:
- Change the system prompt/behavior
- Add new tools
- Modify conversation flow

## License

MIT License

## Credits

- [Pipecat](https://pipecat.ai/) - Real-time voice AI framework
- [Google Gemini Live API](https://ai.google.dev/gemini-api/docs/live) - Multimodal live AI
- [Daily.co](https://daily.co/) - WebRTC infrastructure
