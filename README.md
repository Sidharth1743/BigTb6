# TB Diagnostic Assistant - Gemini Live

A real-time multimodal AI health companion using Google's Gemini Live API for TB (Tuberculosis) diagnosis through cough analysis.

## Features

- **Real-time Voice Conversation**: Talk to Dr. AI through your microphone
- **Cough Analysis**: Analyze cough sounds for TB probability using AI
- **WebRTC Streaming**: Low-latency audio/video communication
- **Tool Integration**: Gemini Live function calling for recording and analyzing audio

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

### Terminal 1 - Backend

```bash
cd server
./venv/bin/python bot.py -t webrtc --host localhost --port 7860
```

### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

### Access the Application

1. Open http://localhost:3000 in your browser
2. Grant microphone and camera permissions
3. Click "Start Consultation"

## How It Works

### Conversation Flow

1. **Greeting**: Dr. AI introduces itself and asks how you're feeling
2. **Symptom Inquiry**: Ask questions about TB-related symptoms
3. **Cough Analysis**: When you mention you have a cough:
   - Dr. AI calls `record_cough_sound` tool
   - Records 4 seconds of audio while you cough
   - Automatically calls `analyze_cough_for_tb` tool
   - Returns TB probability result

### Tools

| Tool | Description |
|------|-------------|
| `record_cough_sound` | Records user's cough for 4 seconds |
| `analyze_cough_for_tb` | Analyzes recorded cough for TB probability |

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
│   ├── tb_audio_tool.py  # TB audio recording & analysis
│   ├── main.py           # FastAPI server
│   ├── requirements.txt  # Python dependencies
│   └── venv/             # Virtual environment
├── docs/                  # Documentation
│   └── plans/            # Implementation plans
└── pipecat/              # Custom Pipecat fork
```

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
