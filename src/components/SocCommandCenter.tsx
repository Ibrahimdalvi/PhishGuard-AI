import {
  useEffect,
  useState,
} from 'react';

import {
  PlaybookModule,
} from '../types';

import {
  PLAYBOOK_MODULES,
} from '../data/mockData';

import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Bot,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Radar,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

interface SocCommandCenterProps {
  onScanUrl: (url: string) => void;
  onOpenPlaybook: (
    playbook: PlaybookModule
  ) => void;
  onNavigateToTips?: () => void;
  onNavigateToChatbot?: () => void;
}

type ScanHistoryRecord = {
  id: string;
  url: string;
  status:
    | 'Phishing'
    | 'Suspicious'
    | 'Safe';
  risk: number;
  time: string;
  source: string;
  createdAt: string;
};

const STORAGE_KEY =
  'phishguard_scan_history';

export default function SocCommandCenter({
  onScanUrl,
  onOpenPlaybook,
  onNavigateToTips,
  onNavigateToChatbot,
}: SocCommandCenterProps) {
  const [
    quickScanOpen,
    setQuickScanOpen,
  ] = useState(false);

  const [
    quickInputUrl,
    setQuickInputUrl,
  ] = useState('');

  const [
    isScanning,
    setIsScanning,
  ] = useState(false);

  const [
    scanFeedback,
    setScanFeedback,
  ] = useState<string | null>(
    null
  );

  const [
    scanHistory,
    setScanHistory,
  ] = useState<
    ScanHistoryRecord[]
  >([]);

  /*
   Load real scan telemetry
   from localStorage
  */
  const loadScanHistory = () => {
    try {
      const savedHistory =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!savedHistory) {
        setScanHistory([]);
        return;
      }

      const parsedHistory =
        JSON.parse(savedHistory);

      if (
        Array.isArray(
          parsedHistory
        )
      ) {
        const sortedHistory =
          parsedHistory.sort(
            (
              a: ScanHistoryRecord,
              b: ScanHistoryRecord
            ) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          );

        setScanHistory(
          sortedHistory
        );
      }
    } catch {
      setScanHistory([]);
    }
  };

  /*
   Load scans when
   dashboard opens
  */
  useEffect(() => {
    loadScanHistory();

    const handleFocus = () => {
      loadScanHistory();
    };

    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key ===
        STORAGE_KEY
      ) {
        loadScanHistory();
      }
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  const handleQuickScan = () => {
    const url =
      quickInputUrl.trim();

    if (!url) {
      setScanFeedback(
        'Please enter a URL to scan.'
      );
      return;
    }

    setIsScanning(true);

    setScanFeedback(
      null
    );

    setTimeout(() => {
      setIsScanning(false);

      setScanFeedback(
        'Opening URL Scanner...'
      );

      setTimeout(() => {
        onScanUrl(url);
      }, 500);
    }, 600);
  };

  /*
   REAL TELEMETRY
   CALCULATIONS
  */

  const totalScans =
    scanHistory.length;

  const safeCount =
    scanHistory.filter(
      (scan) =>
        scan.status === 'Safe'
    ).length;

  const suspiciousCount =
    scanHistory.filter(
      (scan) =>
        scan.status ===
        'Suspicious'
    ).length;

  const phishingCount =
    scanHistory.filter(
      (scan) =>
        scan.status ===
        'Phishing'
    ).length;

  const averageRisk =
    totalScans > 0
      ? Math.round(
          scanHistory.reduce(
            (
              total,
              scan
            ) =>
              total +
              scan.risk,
            0
          ) /
            totalScans
        )
      : 0;

  const highestRisk =
    totalScans > 0
      ? Math.max(
          ...scanHistory.map(
            (scan) =>
              scan.risk
          )
        )
      : 0;

  const recentScans =
    scanHistory.slice(
      0,
      6
    );

  const getStatusStyle = (
    status: ScanHistoryRecord['status']
  ) => {
    if (
      status ===
      'Phishing'
    ) {
      return {
        text:
          'text-red-400',
        bg:
          'bg-red-500/10 border-red-500/20',
        icon:
          'text-red-400',
      };
    }

    if (
      status ===
      'Suspicious'
    ) {
      return {
        text:
          'text-orange-400',
        bg:
          'bg-orange-500/10 border-orange-500/20',
        icon:
          'text-orange-400',
      };
    }

    return {
      text:
        'text-emerald-400',
      bg:
        'bg-emerald-500/10 border-emerald-500/20',
      icon:
        'text-emerald-400',
    };
  };

  const getRiskColor = (
    risk: number
  ) => {
    if (
      risk >= 70
    ) {
      return 'text-red-400';
    }

    if (
      risk >= 40
    ) {
      return 'text-orange-400';
    }

    return 'text-emerald-400';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Top Banner */}
      <div className="rounded-2xl bg-[#141722] border border-[#242a38] p-5 sm:p-6 shadow-xl relative overflow-hidden">

        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div className="space-y-2">

            <div className="flex items-center gap-2">

              <span className="relative flex h-2.5 w-2.5">

                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />

                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />

              </span>

              <span className="text-xs font-mono font-bold tracking-wider text-teal-400 uppercase">
                PhishGuard AI Security Center
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Intelligent Phishing Detection
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Scan suspicious URLs and analyze potential phishing threats using intelligent security analysis.
            </p>

          </div>

          <button
            onClick={() =>
              setQuickScanOpen(
                !quickScanOpen
              )
            }
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
          >

            <Radar className="w-4 h-4" />

            Scan URL

          </button>

        </div>

        {/* Quick Scanner */}
        {quickScanOpen && (

          <div className="mt-5 pt-5 border-t border-[#242a38] space-y-3">

            <div className="flex items-center justify-between">

              <span className="text-xs font-mono font-semibold text-purple-300">
                Quick URL Scan
              </span>

              <button
                onClick={() =>
                  setQuickScanOpen(
                    false
                  )
                }
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Close
              </button>

            </div>

            <div className="relative flex items-center">

              <input
                type="text"
                value={
                  quickInputUrl
                }
                onChange={(e) =>
                  setQuickInputUrl(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    'Enter'
                  ) {
                    handleQuickScan();
                  }
                }}
                placeholder="Paste a URL to scan..."
                className="w-full h-11 pl-4 pr-28 rounded-xl bg-[#0d0f15] border border-[#2a3142] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
              />

              <button
                disabled={
                  isScanning
                }
                onClick={
                  handleQuickScan
                }
                className="absolute right-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-all"
              >

                {isScanning
                  ? 'Opening...'
                  : 'Analyze'}

              </button>

            </div>

            {scanFeedback && (

              <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-teal-400" />

                {scanFeedback}

              </div>

            )}

          </div>

        )}

      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Scans */}
        <div className="rounded-2xl bg-[#141722] border border-[#242a38] p-5">

          <div className="flex items-center justify-between">

            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Total Scans
            </span>

            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">

              <Activity className="w-4 h-4" />

            </div>

          </div>

          <div className="mt-3 text-3xl font-bold text-white">
            {totalScans}
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {totalScans === 0
              ? 'No scans recorded yet'
              : 'Total URLs analyzed'}
          </p>

        </div>

        {/* Safe Websites */}
        <div className="rounded-2xl bg-[#141722] border border-emerald-500/20 p-5">

          <div className="flex items-center justify-between">

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Safe Websites
            </span>

            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">

              <ShieldCheck className="w-4 h-4" />

            </div>

          </div>

          <div className="mt-3 text-3xl font-bold text-white">
            {safeCount}
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {safeCount === 0
              ? 'No safe URLs yet'
              : 'Legitimate URLs detected'}
          </p>

        </div>

        {/* Suspicious */}
        <div className="rounded-2xl bg-[#141722] border border-orange-500/20 p-5">

          <div className="flex items-center justify-between">

            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
              Suspicious Websites
            </span>

            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">

              <AlertTriangle className="w-4 h-4" />

            </div>

          </div>

          <div className="mt-3 text-3xl font-bold text-white">
            {suspiciousCount}
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {suspiciousCount === 0
              ? 'No suspicious URLs detected'
              : 'URLs require caution'}
          </p>

        </div>

        {/* Phishing */}
        <div className="rounded-2xl bg-[#141722] border border-red-500/20 p-5">

          <div className="flex items-center justify-between">

            <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
              Phishing Websites
            </span>

            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">

              <Flame className="w-4 h-4" />

            </div>

          </div>

          <div className="mt-3 text-3xl font-bold text-white">
            {phishingCount}
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {phishingCount === 0
              ? 'No phishing threats detected'
              : 'High-risk threats found'}
          </p>

        </div>

      </div>

      {/* Risk Analytics */}
      <div className="rounded-2xl bg-[#141722] border border-[#242a38] p-6">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-lg font-bold text-white">
              Risk Analytics
            </h2>

            <p className="text-xs text-zinc-400 mt-1">
              Real-time analytics generated from URL scan telemetry.
            </p>

          </div>

          <TrendingUp className="w-5 h-5 text-purple-400" />

        </div>

        {totalScans === 0 ? (

          <div className="min-h-[220px] rounded-xl bg-[#0f1118] border border-[#222736] flex flex-col items-center justify-center text-center p-6">

            <Activity className="w-10 h-10 text-zinc-600 mb-3" />

            <h3 className="text-sm font-semibold text-zinc-300">
              No Analytics Available
            </h3>

            <p className="text-xs text-zinc-500 mt-2 max-w-md">
              Perform URL scans to generate risk scores, detection statistics, and threat analytics.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Average Risk */}
            <div className="rounded-xl bg-[#0f1118] border border-[#242a38] p-5">

              <p className="text-xs uppercase font-mono text-zinc-500">
                Average Risk
              </p>

              <div className={`mt-3 text-3xl font-bold ${getRiskColor(
                averageRisk
              )}`}>
                {averageRisk}
                <span className="text-sm text-zinc-500">
                  /100
                </span>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Average threat score across all scans
              </p>

            </div>

            {/* Highest Risk */}
            <div className="rounded-xl bg-[#0f1118] border border-[#242a38] p-5">

              <p className="text-xs uppercase font-mono text-zinc-500">
                Highest Risk
              </p>

              <div className={`mt-3 text-3xl font-bold ${getRiskColor(
                highestRisk
              )}`}>
                {highestRisk}
                <span className="text-sm text-zinc-500">
                  /100
                </span>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Highest threat score detected
              </p>

            </div>

            {/* Threat Rate */}
            <div className="rounded-xl bg-[#0f1118] border border-[#242a38] p-5">

              <p className="text-xs uppercase font-mono text-zinc-500">
                Threat Rate
              </p>

              <div className="mt-3 text-3xl font-bold text-red-400">

                {Math.round(
                  (
                    (phishingCount +
                      suspiciousCount) /
                    totalScans
                  ) *
                    100
                )}
                %

              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Suspicious and phishing URLs
              </p>

            </div>

          </div>

        )}

      </div>

      {/* AI Protection */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#161324] to-[#12141c] border border-purple-500/30 p-5 sm:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">

              <Bot className="w-5 h-5" />

            </div>

            <div>

              <h2 className="text-lg font-bold text-white">
                AI Security Assistant
              </h2>

              <p className="text-xs text-zinc-400">
                Ask cybersecurity questions and get assistance with phishing awareness.
              </p>

            </div>

          </div>

          <button
            onClick={
              onNavigateToChatbot
            }
            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-2 transition-all"
          >

            <Sparkles className="w-4 h-4" />

            Open AI Chatbot

            <ChevronRight className="w-3.5 h-3.5" />

          </button>

        </div>

      </div>

      {/* Recent Scan Activity */}
      <div className="rounded-2xl bg-[#141722] border border-[#242a38] p-5 sm:p-6">

        <div className="flex items-center justify-between mb-5">

          <div className="flex items-center gap-2.5">

            <Search className="w-5 h-5 text-purple-400" />

            <div>

              <h2 className="text-lg font-bold text-white">
                Recent Scan Activity
              </h2>

              <p className="text-xs text-zinc-400">
                Latest telemetry from your scanned URLs.
              </p>

            </div>

          </div>

        </div>

        {recentScans.length ===
        0 ? (

          <div className="min-h-[180px] rounded-xl border border-[#242a38] bg-[#0f1118] flex flex-col items-center justify-center text-center p-6">

            <Search className="w-10 h-10 text-zinc-600 mb-3" />

            <h3 className="text-sm font-semibold text-zinc-300">
              No Scans Yet
            </h3>

            <p className="text-xs text-zinc-500 mt-2">
              Scan a suspicious URL to see its results here.
            </p>

            <button
              onClick={() =>
                setQuickScanOpen(
                  true
                )
              }
              className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              Scan Your First URL
            </button>

          </div>

        ) : (

          <div className="space-y-3">

            {recentScans.map(
              (scan) => {
                const style =
                  getStatusStyle(
                    scan.status
                  );

                return (

                  <div
                    key={scan.id}
                    onClick={() =>
                      onScanUrl(
                        scan.url
                      )
                    }
                    className="cursor-pointer rounded-xl border border-[#242a38] bg-[#0f1118] p-4 hover:border-purple-500/40 transition-all"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${style.bg}`}>

                          {scan.status ===
                          'Phishing' ? (

                            <ShieldAlert className="w-5 h-5 text-red-400" />

                          ) : scan.status ===
                            'Suspicious' ? (

                            <AlertTriangle className="w-5 h-5 text-orange-400" />

                          ) : (

                            <ShieldCheck className="w-5 h-5 text-emerald-400" />

                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-semibold text-white truncate max-w-[500px]">
                            {scan.url}
                          </p>

                          <p className="text-xs text-zinc-500 mt-1">
                            {scan.time}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-center gap-5">

                        <div className="text-right">

                          <p className="text-[10px] uppercase text-zinc-500">
                            Risk Score
                          </p>

                          <p className={`text-sm font-bold ${getRiskColor(
                            scan.risk
                          )}`}>
                            {scan.risk}/100
                          </p>

                        </div>

                        <span className={`px-3 py-1 rounded-full border text-[10px] font-bold ${style.bg} ${style.text}`}>
                          {scan.status}
                        </span>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* Security Tips */}
      <div className="rounded-2xl bg-[#141722] border border-[#242a38] p-5 sm:p-6">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2.5">

            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">

              <Lightbulb className="w-4 h-4" />

            </div>

            <div>

              <h2 className="text-lg font-bold text-white">
                Security Tips & Defense Playbooks
              </h2>

              <p className="text-xs text-zinc-400">
                Learn how to identify and avoid phishing attacks.
              </p>

            </div>

          </div>

          <button
            onClick={
              onNavigateToTips
            }
            className="text-xs font-mono text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >

            View All Tips

            <ChevronRight className="w-3.5 h-3.5" />

          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {PLAYBOOK_MODULES
            .slice(0, 3)
            .map(
              (module) => (

                <div
                  key={module.id}
                  onClick={() =>
                    onOpenPlaybook(
                      module
                    )
                  }
                  className="p-4 rounded-xl bg-[#0f1118] border border-[#242a38] hover:border-purple-500/40 flex flex-col justify-between space-y-3 transition-all cursor-pointer group"
                >

                  <div className="space-y-2">

                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">

                      {module.tag}

                    </span>

                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">

                      {module.title}

                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2">

                      {module.description}

                    </p>

                  </div>

                  <div className="pt-2 border-t border-[#1f2433] flex items-center justify-between text-xs font-semibold text-teal-400">

                    <span>
                      Read Full Playbook
                    </span>

                    <ArrowRight className="w-3.5 h-3.5" />

                  </div>

                </div>

              )
            )}

        </div>

      </div>

    </div>
  );
}