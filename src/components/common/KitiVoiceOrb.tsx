import React, { useState, useEffect } from 'react';
import { useKitiStore } from '../../services/store';
import { AIVoiceService, type VoiceExecutionResult } from '../../services/aiVoiceService';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  ChevronUp,
  ChevronDown,
  Terminal,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KitiVoiceOrbProps {
  voiceService: AIVoiceService | null;
}

export const KitiVoiceOrb: React.FC<KitiVoiceOrbProps> = ({ voiceService }) => {
  const { state, setIsVoiceListening, addVoiceLog } = useKitiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceExecutionResult | null>(null);

  useEffect(() => {
    if (!voiceService) return;

    voiceService.setCallbacks(
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          setIsProcessing(true);
        }
      },
      (result) => {
        setIsProcessing(false);
        setLastResult(result);
        addVoiceLog({
          transcript: result.transcript,
          response: result.spokenReply,
          toolCalled: result.toolCalled,
          toolArgs: result.toolArgs,
          status: result.success ? 'success' : 'error'
        });
      }
    );
  }, [voiceService, addVoiceLog]);

  const toggleListening = () => {
    if (!voiceService) return;
    if (state.isVoiceListening) {
      voiceService.stopListening();
      setIsVoiceListening(false);
    } else {
      voiceService.startListening();
      setIsVoiceListening(true);
      setIsOpen(true);
    }
  };

  const handleSimulateCommand = async (command: string) => {
    if (!voiceService) return;
    setLiveTranscript(command);
    setIsProcessing(true);
    setIsOpen(true);

    try {
      const res = await voiceService.processVoiceCommand(command);
      setLastResult(res);
      addVoiceLog({
        transcript: res.transcript,
        response: res.spokenReply,
        toolCalled: res.toolCalled,
        toolArgs: res.toolArgs,
        status: res.success ? 'success' : 'error'
      });
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample role-tailored voice prompts
  const roleSampleCommands: Record<string, string[]> = {
    'Waiter': [
      'Hey Kiti, table 5: two paneer tikka, one coke',
      'Hey Kiti, is table 3 ready to bill?',
      'Hey Kiti, what did table 1 order?'
    ],
    'Kitchen Chief': [
      'Hey Kiti, how many orders are pending?',
      "Hey Kiti, mark table 1's dal makhani ready",
      "Hey Kiti, we're out of paneer tikka"
    ],
    'Manager': [
      'Hey Kiti, any complaints today?',
      'Hey Kiti, what did table 1 order?',
      "Hey Kiti, cancel table 3's order"
    ],
    'Owner': [
      "Hey Kiti, what's today's sales?",
      "Hey Kiti, what's our most sold dish this week?",
      'Hey Kiti, any complaints today?'
    ]
  };

  const currentPrompts = roleSampleCommands[state.currentRole] || roleSampleCommands['Waiter'];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Voice Console Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-96 max-w-[calc(100vw-3rem)] bg-slate-900/95 border border-purple-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl text-xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm tracking-tight flex items-center gap-1.5">
                    Kiti AI Assistant
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      NLU Voice Core
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Trigger: "Hey Kiti" or tap mic</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Live Waveform & Status */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${state.isVoiceListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                  {state.isVoiceListening ? 'Listening for "Hey Kiti"...' : 'Mic Inactive (Tap mic to speak)'}
                </span>
                {state.isVoiceListening && (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-indigo-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-pink-400 rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>

              {/* Transcript Display */}
              <div className="text-slate-200 min-h-[36px] italic flex items-center">
                {liveTranscript ? (
                  <span>"{liveTranscript}"</span>
                ) : (
                  <span className="text-slate-500">Speak naturally: "Hey Kiti, table 5 two paneer tikka..."</span>
                )}
              </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-purple-950/40 text-purple-300 font-semibold text-xs border border-purple-500/30">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span>Executing NLU Function Call...</span>
              </div>
            )}

            {/* Function Calling Execution Result Card */}
            {lastResult && (
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    Tool Called: <strong className="text-purple-300">{lastResult.toolCalled}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    lastResult.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {lastResult.success ? 'Success' : 'Error'}
                  </span>
                </div>

                {/* Spoken Response */}
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-200 text-xs flex items-start gap-2">
                  <Volume2 className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                  <span>{lastResult.spokenReply}</span>
                </div>
              </div>
            )}

            {/* Role-Specific Voice Shortcut Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <PlayCircle className="w-3 h-3 text-amber-400" />
                Quick {state.currentRole} Voice Simulation:
              </span>
              <div className="flex flex-col gap-1.5">
                {currentPrompts.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleSimulateCommand(cmd)}
                    className="text-left px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition text-[11px] truncate flex items-center justify-between group"
                  >
                    <span>{cmd}</span>
                    <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition">Run</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Kiti Orb Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleListening}
        aria-label="Toggle Kiti Voice Assistant"
        className={`relative flex items-center gap-3 p-3.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 border ${
          state.isVoiceListening
            ? 'bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 border-white text-white shadow-rose-500/50 ring-4 ring-rose-500/30'
            : 'bg-gradient-to-tr from-slate-900 to-indigo-950 border-purple-500/40 text-purple-200 shadow-purple-950/60 hover:border-purple-400'
        }`}
      >
        {/* Pulsing Aura */}
        <span className={`absolute inset-0 rounded-full ${state.isVoiceListening ? 'animate-ping bg-rose-500/30' : 'bg-purple-500/10'}`} />

        <div className="relative flex items-center justify-center w-7 h-7">
          {state.isVoiceListening ? (
            <Mic className="w-5 h-5 text-white animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-purple-300" />
          )}
        </div>

        <div className="pr-2 flex flex-col text-left">
          <span className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1">
            Kiti Voice
            <Sparkles className="w-3 h-3 text-amber-400" />
          </span>
          <span className="text-[10px] text-slate-300 font-medium">
            {state.isVoiceListening ? 'Listening...' : '"Hey Kiti"'}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white ml-1"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </motion.button>
    </div>
  );
};
