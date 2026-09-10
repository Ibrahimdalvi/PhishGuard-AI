import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../data/mockData';

interface SentinelAiAssistantProps {
  onShowToast: (msg: string, isAlert?: boolean) => void;
  onInspectUrl: (url: string) => void;
}

export default function SentinelAiAssistant({
  onShowToast,
  onInspectUrl,
}: SentinelAiAssistantProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  const [inputValue, setInputValue] = useState('');
  const [voiceActive, setVoiceActive] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const speakText = (text: string) => {
    if (
      !audioFeedback ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputValue.trim();

    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'analyst',
      timestamp:
        new Date().toISOString().substring(11, 19) + ' UTC',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    setTimeout(() => {
      let botResponse: ChatMessage;

      const lower = query.toLowerCase();

      if (lower.includes('punycode')) {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          text:
            `Punycode (RFC 3492) transforms Internationalized Domain Names (IDNs) into an ASCII-Compatible Encoding prefixed with "xn--".\n\n` +
            `Threat actors exploit this through Homograph Attacks by substituting identical-looking characters from other scripts. ` +
            `Modern browsers use security checks to detect suspicious mixed-script domains.`,
        };
      } else if (lower.includes('oauth')) {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          text:
            `Fake OAuth Consent Phishing tricks users into authorizing malicious applications.\n\n` +
            `Key Red Flags:\n` +
            `1. Missing verified publisher\n` +
            `2. Excessive permission requests\n` +
            `3. Suspicious redirect URLs\n` +
            `4. Unknown application identity`,
        };
      } else if (lower.includes('yara')) {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          text:
            `Here is a sample YARA rule for suspicious phishing indicators:\n\n` +
            `rule PhishGuard_Suspicious_Domain {\n` +
            `  meta:\n` +
            `    author = "Sentinel AI Advisor"\n` +
            `    severity = "HIGH"\n\n` +
            `  strings:\n` +
            `    $s1 = "verify-account" nocase\n` +
            `    $s2 = "login-security" nocase\n` +
            `    $s3 = "password-reset" nocase\n\n` +
            `  condition:\n` +
            `    2 of ($s*)\n` +
            `}`,
        };
      } else if (
        lower.includes('sinkhole') ||
        lower.includes('quarantine')
      ) {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          text:
            `Simulation mode: containment workflow prepared.\n\n` +
            `Recommended actions:\n` +
            `• Block suspicious domain\n` +
            `• Add IOC to monitoring list\n` +
            `• Create SIEM incident ticket\n` +
            `• Review affected endpoints`,
        };
      } else if (
        lower.includes('http') ||
        lower.includes('.com') ||
        lower.includes('.net') ||
        lower.includes('.org')
      ) {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          isStructuredVerdict: true,
          verdictTitle: 'URL ANALYSIS RESULT',
          verdictDomain: query,
          confidence: '98.6% HEURISTIC INDEX',
          findings: [
            {
              title: '1. Autonomous Heuristic Evaluation',
              desc:
                'The URL structure contains suspicious patterns commonly associated with phishing and impersonation campaigns.',
              icon: 'warning',
              type: 'warning',
            },
            {
              title: '2. Domain & Content Analysis',
              desc:
                'Additional verification is recommended for certificate reputation, domain age, redirects, and login page similarity.',
              icon: 'history',
              type: 'history',
            },
          ],
          recommendation:
            'Target has been queued for further analysis. Inspect the URL Scanner for detailed security indicators and risk assessment.',
          actions: {
            sinkhole: true,
            shareTicket: true,
          },
        };
      } else {
        botResponse = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sentinel',
          timestamp:
            new Date().toISOString().substring(11, 19) + ' UTC',
          text:
            `Understood, Analyst. Sentinel AI is ready to assist with phishing analysis, suspicious URLs, OAuth threats, email headers, Punycode attacks, and threat intelligence.\n\n` +
            `Tell me what you want to investigate.`,
        };
      }

      setIsThinking(false);

      setMessages((prev) => [
        ...prev,
        botResponse,
      ]);

      if (botResponse.text) {
        speakText(botResponse.text.substring(0, 150));
      }
    }, 1100);
  };

  const handleSinkhole = (domain?: string) => {
    onShowToast(
      `Containment simulation applied for ${
        domain || 'origin domain'
      }.`,
      true
    );
  };

  const handleShareTicket = (domain?: string) => {
    onShowToast(
      `SIEM incident ticket created for ${
        domain || 'this incident'
      }.`
    );
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-3 space-y-4 pb-12 text-[#dce2f7]">

      {/* HEADER */}
      <section className="flex flex-col w-full bg-[#141b2b] rounded-xl p-4 shadow-lg relative overflow-hidden border border-[#232a3a]/60">

        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#a078ff]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">

          <div className="flex items-center gap-3">

            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#2e3545] shadow-[0_0_20px_rgba(160,120,255,0.35)]">

              <span
                className="material-symbols-outlined text-[#d0bcff] text-[28px]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                psychology
              </span>

              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4fdbc8] rounded-full shadow-[0_0_8px_#4fdbc8] animate-pulse" />

            </div>

            <div className="flex flex-col">

              <div className="flex items-center gap-2">

                <h1 className="font-headline-sm text-base text-[#dce2f7] font-bold">
                  Sentinel AI Advisor
                </h1>

                <span className="px-1.5 py-0.5 rounded-full bg-[#a078ff]/20 text-[#d0bcff] font-label-sm text-[10px] uppercase tracking-wider font-mono">
                  v4.5
                </span>

              </div>

              <p className="font-label-sm text-[11px] text-[#4fdbc8] flex items-center gap-1.5 mt-0.5">

                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]" />

                PhishShield Engine • Real-time Threat Intel

              </p>

            </div>

          </div>

          <button
            aria-label="Toggle Audio Feedback"
            onClick={() => {
              setAudioFeedback(!audioFeedback);

              onShowToast(
                audioFeedback
                  ? 'Voice synthesis muted'
                  : 'Voice synthesis active'
              );
            }}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#191f2f] hover:bg-[#232a3a] text-[#cbc3d7] transition-colors border border-[#232a3a]"
          >

            <span className="material-symbols-outlined text-[18px]">

              {audioFeedback
                ? 'volume_up'
                : 'volume_off'}

            </span>

          </button>

        </div>

        {/* MODE SELECTOR */}

        <div className="mt-4 grid grid-cols-2 p-1 bg-[#070e1d] rounded-lg gap-1 relative z-10 border border-[#232a3a]">

          <button
            onClick={() => setVoiceActive(false)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-label-md text-xs transition-all ${
              !voiceActive
                ? 'bg-[#d0bcff] text-[#3c0091] font-bold shadow-[0_0_14px_rgba(160,120,255,0.4)]'
                : 'text-[#cbc3d7] hover:text-[#dce2f7]'
            }`}
          >

            <span className="material-symbols-outlined text-[16px]">
              terminal
            </span>

            TEXT ANALYSIS

          </button>

          <button
            onClick={() => setVoiceActive(true)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-label-md text-xs transition-all ${
              voiceActive
                ? 'bg-[#d0bcff] text-[#3c0091] font-bold shadow-[0_0_14px_rgba(160,120,255,0.4)]'
                : 'text-[#cbc3d7] hover:text-[#dce2f7]'
            }`}
          >

            <span
              className="material-symbols-outlined text-[16px]"
              style={{
                fontVariationSettings: "'FILL' 1",
              }}
            >
              graphic_eq
            </span>

            VOICE ACTIVE

          </button>

        </div>

      </section>

      {/* VOICE ORB */}

      {voiceActive && (

        <section className="flex flex-col items-center justify-center w-full bg-[#070e1d] rounded-xl p-6 shadow-xl relative overflow-hidden border border-[#232a3a]/80">

          <div className="absolute inset-0 bg-gradient-to-b from-[#a078ff]/10 via-transparent to-[#04b4a2]/5 pointer-events-none" />

          <div className="relative flex items-center justify-center w-36 h-36 my-2">

            <div className="absolute inset-0 rounded-full bg-[#d0bcff]/10 animate-ping opacity-30" />

            <div className="absolute inset-2 rounded-full bg-[#a078ff]/15 animate-pulse" />

            <div className="absolute inset-5 rounded-full bg-[#232a3a] shadow-[inset_0_0_24px_rgba(160,120,255,0.3)]" />

            <button
              aria-label="Tap to speak"
              onClick={() => {
                onShowToast(
                  'Listening for analyst voice query...'
                );

                setInputValue(
                  'Analyze suspicious phishing URL'
                );
              }}
              className="relative z-10 w-20 h-20 rounded-full bg-[#d0bcff] text-[#3c0091] flex flex-col items-center justify-center shadow-[0_0_32px_rgba(160,120,255,0.6)] active:scale-95 transition-transform cursor-pointer"
            >

              <span className="material-symbols-outlined text-[32px]">
                mic
              </span>

              <span className="font-label-sm text-[8px] uppercase tracking-tighter mt-0.5 font-bold">
                TAP TO SPEAK
              </span>

            </button>

          </div>

          <div className="flex items-center justify-center gap-1.5 h-8 my-2 w-full max-w-xs">

            <span className="w-1 bg-[#4fdbc8] rounded-full animate-pulse h-3" />

            <span
              className="w-1 bg-[#d0bcff] rounded-full animate-pulse h-6"
              style={{ animationDelay: '120ms' }}
            />

            <span
              className="w-1 bg-[#a078ff] rounded-full animate-pulse h-4"
              style={{ animationDelay: '240ms' }}
            />

            <span
              className="w-1 bg-[#4fdbc8] rounded-full animate-pulse h-7"
              style={{ animationDelay: '80ms' }}
            />

            <span
              className="w-1 bg-[#d0bcff] rounded-full animate-pulse h-8"
              style={{ animationDelay: '310ms' }}
            />

            <span
              className="w-1 bg-[#4fdbc8] rounded-full animate-pulse h-5"
              style={{ animationDelay: '150ms' }}
            />

            <span
              className="w-1 bg-[#d0bcff] rounded-full animate-pulse h-7"
              style={{ animationDelay: '200ms' }}
            />

          </div>

          <p className="font-code-md text-xs text-[#4fdbc8] tracking-wide text-center">
            Listening... speak a URL, paste code, or ask about an incident
          </p>

          <span className="font-label-sm text-[9px] text-[#958ea0] mt-1 tracking-widest uppercase font-mono">
            AUDIO ENCRYPTION ACTIVE • TLS 1.3
          </span>

        </section>

      )}

      {/* CHAT */}

      <section className="flex flex-col w-full space-y-4">

        {messages.map((msg) => {

          if (
            msg.sender === 'sentinel' &&
            !msg.isStructuredVerdict
          ) {

            return (

              <div
                key={msg.id}
                className="flex items-start gap-2.5 max-w-[95%]"
              >

                <div className="w-8 h-8 rounded-lg bg-[#a078ff]/20 text-[#d0bcff] flex items-center justify-center shrink-0 mt-1 shadow-sm">

                  <span className="material-symbols-outlined text-[18px]">
                    smart_toy
                  </span>

                </div>

                <div className="flex flex-col bg-[#141b2b] rounded-xl rounded-tl-none p-3.5 shadow-md space-y-1 text-[#dce2f7] border border-[#232a3a]">

                  <div className="flex items-center justify-between gap-4">

                    <span className="font-label-sm text-[10px] text-[#d0bcff] font-bold tracking-wider uppercase">
                      SENTINEL AI
                    </span>

                    <span className="font-label-sm text-[10px] text-[#958ea0] font-mono">
                      {msg.timestamp}
                    </span>

                  </div>

                  <p className="font-body-md text-xs leading-relaxed text-[#cbc3d7] whitespace-pre-line">
                    {msg.text}
                  </p>

                </div>

              </div>

            );
          }

          if (msg.sender === 'analyst') {

            return (

              <div
                key={msg.id}
                className="flex items-start justify-end gap-2.5 max-w-[92%] self-end"
              >

                <div className="flex flex-col bg-[#d0bcff] text-[#3c0091] rounded-xl rounded-tr-none p-3.5 shadow-md space-y-1">

                  <div className="flex items-center justify-between gap-4">

                    <span className="font-label-sm text-[10px] text-[#3c0091] font-bold tracking-wider uppercase">
                      ANALYST (YOU)
                    </span>

                    <span className="font-label-sm text-[10px] opacity-75 font-mono">
                      {msg.timestamp}
                    </span>

                  </div>

                  <p className="font-body-md text-xs font-semibold">
                    {msg.text}
                  </p>

                </div>

                <div className="w-8 h-8 rounded-lg bg-[#2e3545] text-[#4fdbc8] flex items-center justify-center shrink-0 mt-1 shadow-sm">

                  <span className="material-symbols-outlined text-[18px]">
                    account_circle
                  </span>

                </div>

              </div>

            );
          }

          if (msg.isStructuredVerdict) {

            return (

              <div
                key={msg.id}
                className="flex items-start gap-2.5 w-full"
              >

                <div className="w-8 h-8 rounded-lg bg-[#a078ff]/20 text-[#d0bcff] flex items-center justify-center shrink-0 mt-1 shadow-sm">

                  <span className="material-symbols-outlined text-[18px]">
                    security
                  </span>

                </div>

                <div className="flex flex-col w-full bg-[#141b2b] rounded-xl rounded-tl-none p-3.5 shadow-xl space-y-3 text-[#dce2f7] border border-[#232a3a]">

                  <div className="flex items-center justify-between border-b pb-2 border-[#232a3a]">

                    <div className="flex items-center gap-1.5">

                      <span className="w-2 h-2 rounded-full bg-[#ff5451] animate-pulse" />

                      <span className="font-label-sm text-[10px] uppercase font-bold text-[#ffb3ad]">

                        {msg.verdictTitle ||
                          'CRITICAL PHISHING VERDICT'}

                      </span>

                    </div>

                    <span className="font-label-sm text-[10px] text-[#4fdbc8] bg-[#070e1d] px-2 py-0.5 rounded-full font-bold font-mono">

                      {msg.confidence ||
                        '99.8% CONFIDENCE'}

                    </span>

                  </div>

                  <div className="font-code-md text-xs text-[#cbc3d7] leading-relaxed space-y-2">

                    <p className="text-[#dce2f7] font-semibold">

                      Classification Rationale for{' '}

                      <span
                        className="text-[#ffb3ad] cursor-pointer underline decoration-[#ffb3ad]/50 hover:text-white"
                        onClick={() =>
                          msg.verdictDomain &&
                          onInspectUrl(msg.verdictDomain)
                        }
                      >

                        {msg.verdictDomain}

                      </span>

                      :

                    </p>

                    {msg.findings?.map((f, idx) => (

                      <div
                        key={idx}
                        className="bg-[#070e1d] p-2.5 rounded-lg space-y-0.5 border border-[#232a3a]"
                      >

                        <div className="flex items-center gap-1.5 text-[#dce2f7] font-bold text-[11px]">

                          <span className="material-symbols-outlined text-[#ffb3ad] text-[14px]">

                            {f.icon}

                          </span>

                          {f.title}

                        </div>

                        <p className="text-body-sm text-[11px] text-[#cbc3d7]">

                          {f.desc}

                        </p>

                      </div>

                    ))}

                  </div>

                  <div className="bg-[#2e3545]/60 rounded-lg p-3 space-y-1.5 border border-[#232a3a]">

                    <div className="flex items-center gap-1.5 text-[#4fdbc8] font-label-md text-[11px] uppercase font-bold">

                      <span className="material-symbols-outlined text-[16px]">
                        shield_with_heart
                      </span>

                      SENTINEL MITIGATION RECOMMENDATION

                    </div>

                    <p className="font-body-sm text-xs text-[#dce2f7] leading-snug">

                      {msg.recommendation}

                    </p>

                    <div className="flex items-center gap-2 pt-1.5">

                      <button
                        onClick={() =>
                          handleSinkhole(
                            msg.verdictDomain
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#ff5451] hover:bg-[#ff5451]/90 text-white rounded-lg font-label-sm text-[10px] font-bold active:opacity-80 transition-opacity"
                      >

                        <span className="material-symbols-outlined text-[14px]">
                          block
                        </span>

                        EXECUTE SINKHOLE

                      </button>

                      <button
                        onClick={() =>
                          handleShareTicket(
                            msg.verdictDomain
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] text-[#dce2f7] rounded-lg font-label-sm text-[10px] font-semibold transition-colors border border-[#232a3a]"
                      >

                        <span className="material-symbols-outlined text-[14px]">
                          ios_share
                        </span>

                        SHARE SIEM TICKET

                      </button>

                    </div>

                  </div>

                </div>

              </div>

            );
          }

          return null;
        })}

        {isThinking && (

          <div className="flex items-start gap-2.5 max-w-[95%]">

            <div className="w-8 h-8 rounded-lg bg-[#a078ff]/20 text-[#d0bcff] flex items-center justify-center shrink-0 mt-1">

              <span className="material-symbols-outlined text-[18px] animate-spin">
                refresh
              </span>

            </div>

            <div className="bg-[#141b2b] rounded-xl rounded-tl-none p-3 shadow-md text-xs text-[#cbc3d7] flex items-center gap-2 border border-[#232a3a]">

              <span className="w-2 h-2 rounded-full bg-[#d0bcff] animate-ping" />

              <span>
                Analyzing threat telemetry...
              </span>

            </div>

          </div>

        )}

        <div ref={messagesEndRef} />

      </section>

      {/* QUICK PROMPTS */}

      <section className="flex flex-col w-full space-y-1.5">

        <span className="font-label-sm text-[10px] text-[#958ea0] uppercase tracking-wider px-1 font-mono">
          Tactical Analysis Prompts
        </span>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5">

          {[
            {
              label:
                'Explain Punycode attack vectors',
              icon: 'psychology_alt',
              color: 'text-[#d0bcff]',
            },
            {
              label:
                'How to spot fake OAuth consent?',
              icon: 'verified_user',
              color: 'text-[#4fdbc8]',
            },
            {
              label:
                'Analyze DKIM/DMARC headers',
              icon: 'mark_email_read',
              color: 'text-[#d0bcff]',
            },
            {
              label:
                'Generate YARA rule for this URL',
              icon: 'code',
              color: 'text-[#4fdbc8]',
            },
          ].map((chip, idx) => (

            <button
              key={idx}
              onClick={() =>
                handleSendMessage(chip.label)
              }
              className="shrink-0 px-3 py-1.5 rounded-full bg-[#141b2b] hover:bg-[#191f2f] text-[#cbc3d7] hover:text-[#d0bcff] font-label-md text-[11px] transition-colors flex items-center gap-1.5 shadow-sm border border-[#232a3a]"
            >

              <span
                className={`material-symbols-outlined text-[14px] ${chip.color}`}
              >

                {chip.icon}

              </span>

              <span>
                {chip.label}
              </span>

            </button>

          ))}

        </div>

      </section>

      {/* INPUT */}

      <section className="flex items-center gap-2 w-full bg-[#141b2b] p-2 rounded-xl shadow-2xl sticky bottom-20 z-30 border border-[#232a3a]">

        <button
          aria-label="Voice command"
          onClick={() => {
            setVoiceActive(true);

            onShowToast(
              'Voice recognition channel engaged.'
            );
          }}
          className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-[#191f2f] text-[#d0bcff] hover:text-[#4fdbc8] active:scale-95 transition-all border border-[#232a3a]"
        >

          <span className="material-symbols-outlined text-[20px]">
            mic
          </span>

        </button>

        <div className="relative flex-1">

          <input
            id="sentinel-chat-input"
            type="text"
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Ask Sentinel AI or type a suspicious URL..."
            className="w-full h-11 bg-[#070e1d] text-[#dce2f7] placeholder:text-[#958ea0] font-body-sm text-xs rounded-lg pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-[#d0bcff] border border-[#232a3a]"
          />

          <span className="absolute right-2.5 top-3 material-symbols-outlined text-[#958ea0] text-[16px] pointer-events-none">
            travel_explore
          </span>

        </div>

        <button
          id="sentinel-send-btn"
          aria-label="Send message"
          onClick={() =>
            handleSendMessage()
          }
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#a078ff] hover:bg-[#a078ff]/90 text-[#340080] shadow-[0_0_16px_rgba(160,120,255,0.4)] active:scale-95 transition-all"
        >

          <span
            className="material-symbols-outlined text-[20px]"
            style={{
              fontVariationSettings: "'FILL' 1",
            }}
          >
            send
          </span>

        </button>

      </section>

    </div>
  );
}