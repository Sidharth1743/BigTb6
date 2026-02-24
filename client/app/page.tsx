'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PipecatClient } from '@pipecat-ai/client-js';
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { VideoConsultation } from '@/components/VideoConsultation';
import { TranscriptPanel, TranscriptMessage } from '@/components/TranscriptPanel';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [needsAudioGesture, setNeedsAudioGesture] = useState(false);
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayUploading, setXrayUploading] = useState(false);
  const [xrayUploadStatus, setXrayUploadStatus] = useState<string | null>(null);
  const [xrayUploadError, setXrayUploadError] = useState<string | null>(null);
  const [xrayPreviewUrl, setXrayPreviewUrl] = useState<string | null>(null);
  const [xrayStatusIndex, setXrayStatusIndex] = useState(0);
  const botBufferRef = useRef<string>('');
  const liveBotMessageIdRef = useRef<string | null>(null);
  
  const clientRef = useRef<PipecatClient | null>(null);
  const transportRef = useRef<SmallWebRTCTransport | null>(null);
  const botAudioRef = useRef<HTMLAudioElement | null>(null);
  const startEndpoint =
    process.env.NEXT_PUBLIC_PIPECAT_START_ENDPOINT ?? 'http://localhost:7860/start';
  const xrayUploadEndpoint =
    process.env.NEXT_PUBLIC_XRAY_UPLOAD_ENDPOINT ?? 'http://localhost:8000/upload_xray';

  const xrayStatusMessages = [
    'Scanning image parameters...',
    'Analyzing hemoglobin indicators...',
    'Validating imaging quality...',
    'Finalizing triage score...',
  ];

  // Add message to transcript
  const addMessage = useCallback((speaker: 'user' | 'bot', text: string) => {
    const newMessage: TranscriptMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speaker,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const flushBotBuffer = useCallback(() => {
    const text = botBufferRef.current.trim();
    if (text) {
      if (liveBotMessageIdRef.current) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === liveBotMessageIdRef.current ? { ...msg, text } : msg
          )
        );
      } else {
        addMessage('bot', text);
      }
    }
    botBufferRef.current = '';
    liveBotMessageIdRef.current = null;
  }, [addMessage]);

  const attachBotAudioTrack = useCallback((track: MediaStreamTrack) => {
    if (!botAudioRef.current) return;
    if (track.kind !== 'audio') return;

    const stream = new MediaStream([track]);
    botAudioRef.current.srcObject = stream;

    botAudioRef.current
      .play()
      .then(() => setNeedsAudioGesture(false))
      .catch(() => setNeedsAudioGesture(true));
  }, []);

  // Initialize media
  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  // Start session
  const startSession = async () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

    setConnectionStatus('connecting');

    try {
      // Initialize media
      await initMedia();
      
      // Use SmallWebRTC transport with explicit audio configuration
      const transport = new SmallWebRTCTransport({
        waitForICEGathering: false,
      });
      transportRef.current = transport;
      
      clientRef.current = new PipecatClient({
        transport,
        enableMic: micEnabled,
        enableCam: cameraEnabled,
        callbacks: {
          onBotReady: () => {
            console.log('Bot ready');
            setConnectionStatus('connected');
          },
          onUserTranscript: (data: { text: string }) => {
            if (data.text) {
              addMessage('user', data.text);
            }
          },
          onBotOutput: (data: { text?: string }) => {
            if (data.text) {
              botBufferRef.current += data.text;
              if (!liveBotMessageIdRef.current) {
                const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                liveBotMessageIdRef.current = id;
                setMessages(prev => [
                  ...prev,
                  {
                    id,
                    speaker: 'bot',
                    text: '',
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }
              const id = liveBotMessageIdRef.current;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === id ? { ...msg, text: botBufferRef.current } : msg
                )
              );
            }
          },
          onBotStartedSpeaking: () => {
            console.log('Bot started speaking');
          },
          onBotStoppedSpeaking: () => {
            console.log('Bot stopped speaking');
            flushBotBuffer();
          },
          onTransportStateChanged: (state: string) => {
            console.log('Transport state:', state);
            if (state === 'connected') {
              setConnectionStatus('connected');
            } else if (state === 'disconnected') {
              setConnectionStatus('disconnected');
            }
          },
          onTrackStarted: (track: MediaStreamTrack, participant?: { local: boolean }) => {
            if (participant?.local === true) return;
            attachBotAudioTrack(track);
          },
          onError: (error) => {
            console.error('Error:', error);
            setConnectionStatus('error');
          },
        },
      });

      await clientRef.current.startBotAndConnect({ endpoint: startEndpoint });
      
    } catch (error) {
      console.error('Failed to start session:', error);
      setConnectionStatus('error');
    }
  };

  // Stop session
  const stopSession = async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setConnectionStatus('disconnected');
    setScreenSharing(false);
    setMessages([]);
  };

  // Toggle microphone
  const toggleMic = async () => {
    if (!clientRef.current) return;
    
    try {
      if (micEnabled) {
        await clientRef.current.enableMic(false);
      } else {
        await clientRef.current.enableMic(true);
      }
      setMicEnabled(!micEnabled);
    } catch (error) {
      console.error('Error toggling mic:', error);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (!clientRef.current) return;
    
    try {
      if (cameraEnabled) {
        await clientRef.current.enableCam(false);
      } else {
        await clientRef.current.enableCam(true);
      }
      setCameraEnabled(!cameraEnabled);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!clientRef.current) return;
    
    try {
      if (screenSharing) {
        await clientRef.current.enableScreenShare(false);
      } else {
        await clientRef.current.enableScreenShare(true);
      }
      setScreenSharing(!screenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const uploadXray = async () => {
    if (!xrayFile) return;
    setXrayUploading(true);
    setXrayUploadStatus(null);
    setXrayUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', xrayFile);

      const response = await fetch(xrayUploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }

      const data = await response.json();
      setXrayUploadStatus(data?.path ? `Uploaded: ${data.path}` : 'Upload complete');
      setXrayFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setXrayUploadError(message);
    } finally {
      setXrayUploading(false);
    }
  };

  useEffect(() => {
    if (!xrayFile) {
      setXrayPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(xrayFile);
    setXrayPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [xrayFile]);

  useEffect(() => {
    if (!xrayUploading) {
      setXrayStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setXrayStatusIndex((prev) => (prev + 1) % xrayStatusMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [xrayUploading, xrayStatusMessages.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Bot audio output */}
      <audio ref={botAudioRef} autoPlay playsInline className="hidden" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        {/* BigTB6 logo - top left corner, outside centered container */}
        <div className="absolute left-20 top-0 h-16 flex items-center">
          <span className="text-xl font-medium text-slate-900">BigTB6</span>
        </div>

        {/* Right side - Connect button, status, and control buttons */}
        <div className="absolute right-0 top-0 h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <button
            onClick={connectionStatus === 'connected' ? stopSession : startSession}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              connectionStatus === 'connected'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#099c8f] text-white hover:bg-[#07897d] active:bg-[#067a70]'
            }`}
          >
            {connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
          <ConnectionStatus status={connectionStatus} />

          {/* Control buttons */}
          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            disabled={!clientRef.current}
            className={`p-2 rounded-lg border border-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              micEnabled
                ? 'bg-white text-slate-700 hover:bg-slate-50'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
            aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            title={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            disabled={!clientRef.current}
            className={`p-2 rounded-lg border border-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              cameraEnabled
                ? 'bg-white text-slate-700 hover:bg-slate-50'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
            aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            disabled={!clientRef.current}
            className={`p-2 rounded-lg border border-slate-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              screenSharing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-label={screenSharing ? 'Stop sharing screen' : 'Share screen'}
            title={screenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Video Consultation Area */}
          <VideoConsultation 
            localStream={localStream}
            remoteStream={null}
            isConnected={connectionStatus === 'connected'}
            sidePanel={(
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-slate-900">Chest X-ray Upload</div>
                <p className="mt-1 text-xs text-slate-600">Upload an X-ray image for analysis.</p>

                <div className="mt-3 relative">
                  <div
                    className={`transition-opacity duration-300 ease-in-out ${
                      xrayUploading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setXrayFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    />
                    <button
                      onClick={uploadXray}
                      disabled={!xrayFile || xrayUploading}
                      className="mt-3 w-full px-3 py-2 rounded-lg bg-[#099c8f] text-white text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#07897d] transition-colors duration-150"
                    >
                      Upload
                    </button>
                  </div>

                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                      xrayUploading ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {xrayPreviewUrl ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 animate-breathe">
                          <img
                            src={xrayPreviewUrl}
                            alt="Uploaded chest x-ray"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 animate-breathe" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-800">Processing image</p>
                        <p className="text-xs text-slate-500">{xrayStatusMessages[xrayStatusIndex]}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-[#099c8f] animate-breathe" />
                    </div>
                  </div>
                </div>

                {xrayUploadStatus && (
                  <p className="mt-3 text-xs text-emerald-700 transition-opacity duration-300 ease-in-out opacity-100">
                    {xrayUploadStatus}
                  </p>
                )}
                {xrayUploadError && (
                  <p className="mt-3 text-xs text-red-600">{xrayUploadError}</p>
                )}
              </div>
            )}
          />
          
          {/* Transcript Panel */}
          <TranscriptPanel messages={messages} />

          {needsAudioGesture && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  botAudioRef.current?.play().then(() => setNeedsAudioGesture(false));
                }}
                className="px-4 py-2 bg-[#099c8f] text-white rounded-lg text-sm"
              >
                Enable Audio
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600 text-center">
            This is a preliminary screening tool. For medical advice, consult a licensed physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
