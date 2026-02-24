'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoConsultationProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

export function VideoConsultation({ localStream, remoteStream, isConnected }: VideoConsultationProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Main Video Area - AI View */}
      <div className="lg:col-span-2">
        <div className="relative aspect-video bg-gradient-to-br from-teal-900 via-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-teal-800/30">
          
          {/* Remote Video (AI) */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* AI Avatar when no video */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {/* Animated AI Avatar */}
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-teal-400 via-cyan-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/30 animate-pulse-soft">
                  <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-teal-100 text-xl font-semibold">Dr. AI</p>
                <p className="text-teal-400 text-sm mt-1">Your Health Companion</p>
                {isConnected && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-400 text-sm">Listening...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* User Video Preview */}
      <div className="lg:col-span-1">
        <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700/30">
          {localStream ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm font-medium">You</span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">Camera off</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
