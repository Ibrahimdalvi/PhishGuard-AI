import { useState } from 'react';

import {
  NavTab,
  PlaybookModule,
  SystemConfig,
} from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SocCommandCenter from './components/SocCommandCenter';
import NeuralUrlScanner from './components/NeuralUrlScanner';
import TelemetryHistory from './components/TelemetryHistory';
import SentinelAiAssistant from './components/SentinelAiAssistant';
import SecurityTipsView from './components/SecurityTipsView';
import ConfigSettings from './components/ConfigSettings';
import PlaybookModal from './components/PlaybookModal';

export default function App() {
  const [currentTab, setCurrentTab] =
    useState<NavTab>('dashboard');

  const [targetScanUrl, setTargetScanUrl] =
    useState<string>('');

  const [activePlaybook, setActivePlaybook] =
    useState<PlaybookModule | null>(null);

  const [radarActive, setRadarActive] =
    useState<boolean>(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState<boolean>(false);

  const [toast, setToast] = useState<{
    message: string;
    isAlert?: boolean;
  } | null>(null);

  const [systemConfig, setSystemConfig] =
    useState<SystemConfig>({
      heuristicSensitivity: 'Aggressive',
      radarClusterActive: true,
      homoglyphDetection: true,
      neuralOcrScan: true,
      autoSinkhole: false,
      zeroDayTelemetry: true,
      activeRegions: 6,

      feeds: {
        alienVault: true,
        virusTotal: true,
        phishTank: true,
        cisaKnown: true,
      },

      webhooks: {
        slack: true,
        splunk: true,
        sentinel: true,
        pagerduty: false,
      },
    });

  const showToast = (
    message: string,
    isAlert: boolean = false
  ) => {
    setToast({
      message,
      isAlert,
    });

    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  /*
    Navigate any URL from Dashboard,
    History or AI Assistant to Scanner
  */
  const handleScanUrlFromExternal = (
    url: string
  ) => {
    setTargetScanUrl(url);
    setCurrentTab('scanner');
    setMobileMenuOpen(false);
  };

  /*
    Open Scanner without URL
  */
  const handleOpenScanner = () => {
    setTargetScanUrl('');
    setCurrentTab('scanner');
    setMobileMenuOpen(false);
  };

  /*
    Security Tips scanner navigation
  */
  const handleTipsScanner = () => {
    handleOpenScanner();

    showToast(
      'URL Scanner opened. Paste a suspicious website to analyze.'
    );
  };

  const handleToggleRadar = () => {
    const next = !radarActive;

    setRadarActive(next);

    showToast(
      next
        ? 'Security monitoring activated'
        : 'Security monitoring paused'
    );
  };

  const handleTabChange = (
    tab: NavTab
  ) => {
    setCurrentTab(tab);

    setMobileMenuOpen(false);
  };

  /*
    Tab aliases
  */
  const isDashboard =
    currentTab === 'dashboard' ||
    currentTab === 'soc';

  const isScanner =
    currentTab === 'scanner' ||
    currentTab === 'scan';

  const isHistory =
    currentTab === 'history' ||
    currentTab === 'logs';

  const isChatbot =
    currentTab === 'chatbot' ||
    currentTab === 'sentinel';

  const isTips =
    currentTab === 'tips';

  const isSettings =
    currentTab === 'settings' ||
    currentTab === 'config';

  return (
    <div
      className="
        min-h-screen
        bg-[#0e1117]
        text-[#d6dbe9]
        antialiased
        selection:bg-purple-600
        selection:text-white
        flex
        flex-col
      "
    >

      {/* TOAST */}
      {toast && (
        <div
          role="alert"
          className="
            fixed
            top-5
            left-1/2
            -translate-x-1/2
            z-50
            flex
            items-center
            gap-2.5
            px-4
            py-2.5
            rounded-full
            bg-[#1c2130]
            shadow-2xl
            text-white
            text-xs
            border
            border-[#30394d]
          "
        >

          <span
            className={`
              w-2
              h-2
              rounded-full
              ${
                toast.isAlert
                  ? 'bg-red-400 animate-ping'
                  : 'bg-teal-400'
              }
            `}
          />

          <span className="font-medium">
            {toast.message}
          </span>

        </div>
      )}

      {/* SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        radarActive={radarActive}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() =>
          setMobileMenuOpen(false)
        }
      />

      {/* MAIN AREA */}
      <div
        className="
          flex-1
          lg:pl-64
          xl:pl-72
          flex
          flex-col
          min-w-0
          min-h-screen
        "
      >

        {/* HEADER */}
        <Header
          currentTab={currentTab}
          onTabChange={handleTabChange}
          radarActive={radarActive}
          onToggleRadar={handleToggleRadar}
          onOpenMobileMenu={() =>
            setMobileMenuOpen(true)
          }
          onQuickScanTrigger={
            handleOpenScanner
          }
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 pb-12">

          {/* =========================
              DASHBOARD / COMMAND CENTER
          ========================== */}

          {isDashboard && (
            <SocCommandCenter
              onScanUrl={
                handleScanUrlFromExternal
              }
              onOpenPlaybook={(playbook) =>
                setActivePlaybook(playbook)
              }
              onNavigateToTips={() =>
                handleTabChange('tips')
              }
              onNavigateToChatbot={() =>
                handleTabChange('chatbot')
              }
            />
          )}

          {/* =========================
              URL SCANNER
          ========================== */}

          {isScanner && (
            <div
              className="
                w-full
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-6
              "
            >

              <NeuralUrlScanner
                initialUrl={targetScanUrl}
                onNavigateToLogs={() =>
                  handleTabChange('history')
                }
                onShowToast={showToast}
              />

            </div>
          )}

          {/* =========================
              TELEMETRY HISTORY
          ========================== */}

          {isHistory && (
            <div
              className="
                w-full
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-6
              "
            >

              <TelemetryHistory
                onShowToast={showToast}
                onInspectUrl={
                  handleScanUrlFromExternal
                }
              />

            </div>
          )}

          {/* =========================
              AI SECURITY ASSISTANT
          ========================== */}

          {isChatbot && (
            <div
              className="
                w-full
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-6
              "
            >

              <SentinelAiAssistant
                onShowToast={showToast}
                onInspectUrl={
                  handleScanUrlFromExternal
                }
              />

            </div>
          )}

          {/* =========================
              SECURITY TIPS
          ========================== */}

          {isTips && (
            <div
              className="
                w-full
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-6
              "
            >

              <SecurityTipsView
                onShowToast={showToast}
              />

            </div>
          )}

          {/* =========================
              SETTINGS
          ========================== */}

          {isSettings && (
            <div
              className="
                w-full
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-6
              "
            >

              <ConfigSettings
                config={systemConfig}
                onUpdateConfig={
                  setSystemConfig
                }
                onShowToast={showToast}
              />

            </div>
          )}

        </main>

      </div>

      {/* PLAYBOOK MODAL */}

      <PlaybookModal
        playbook={activePlaybook}
        onClose={() =>
          setActivePlaybook(null)
        }
      />

    </div>
  );
}