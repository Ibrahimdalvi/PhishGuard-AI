import { useState } from 'react';
import { SystemConfig } from '../types';

interface ConfigSettingsProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  onShowToast: (msg: string, isAlert?: boolean) => void;
}

export default function ConfigSettings({ config, onUpdateConfig, onShowToast }: ConfigSettingsProps) {
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    onShowToast('Heuristic & Radar configuration updated successfully.');
  };

  const handleReset = () => {
    const defaults: SystemConfig = {
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
    };
    setLocalConfig(defaults);
    onUpdateConfig(defaults);
    onShowToast('Configuration reset to SOC baseline defaults.');
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-3 space-y-4 pb-12 text-[#dce2f7]">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#141b2b] p-4 shadow-lg border border-[#232a3a]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#232a3a] flex items-center justify-center text-[#d0bcff]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-base text-[#dce2f7] font-bold">SOC Radar & Engine Config</h1>
              <p className="font-body-sm text-xs text-[#cbc3d7]">
                Tuning heuristic thresholds, threat feeds, and automated containment
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#4fdbc8]/15 text-[#4fdbc8] font-mono text-[10px] font-bold uppercase">
            ACTIVE v4.8
          </span>
        </div>
      </div>

      {/* Heuristic Sensitivity */}
      <section className="bg-[#191f2f] rounded-xl p-4 space-y-3 border border-[#232a3a]">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-sm font-bold text-[#dce2f7]">Heuristic Detection Profile</span>
          <span className="font-label-sm text-[10px] text-[#4fdbc8] font-mono">LATENCY: 14MS</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['Strict', 'Balanced', 'Aggressive'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLocalConfig({ ...localConfig, heuristicSensitivity: mode })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                localConfig.heuristicSensitivity === mode
                  ? 'bg-[#a078ff] text-[#340080] border-[#a078ff] shadow-md'
                  : 'bg-[#141b2b] text-[#cbc3d7] border-[#232a3a] hover:bg-[#232a3a]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#cbc3d7] leading-relaxed">
          {localConfig.heuristicSensitivity === 'Aggressive'
            ? 'Flags any 0-day domain with homoglyph entropy, short-lived SSL certs, or untrusted ASNs.'
            : localConfig.heuristicSensitivity === 'Balanced'
            ? 'Standard enterprise threshold prioritizing low false positive rates with dual heuristic validation.'
            : 'Conservative baseline for staging environments; flags only authenticated threat signatures.'}
        </p>
      </section>

      {/* Engine Feature Toggles */}
      <section className="bg-[#191f2f] rounded-xl p-4 space-y-3 border border-[#232a3a]">
        <span className="font-headline-sm text-sm font-bold text-[#dce2f7] block">
          Neural Interceptor Capabilities
        </span>

        <div className="space-y-2.5">
          {[
            {
              key: 'homoglyphDetection' as const,
              label: 'Homoglyph & Punycode Normalizer',
              desc: 'Inspect Cyrillic / Greek character substitutions in domain labels',
            },
            {
              key: 'neuralOcrScan' as const,
              label: 'Neural OCR Visual Clone Scanner',
              desc: 'Headless DOM screenshot hashing against top 5,000 corporate login portals',
            },
            {
              key: 'autoSinkhole' as const,
              label: 'Automated Edge DNS Sinkhole',
              desc: 'Immediately inject blackhole routing rules upon score >= 90',
            },
            {
              key: 'zeroDayTelemetry' as const,
              label: 'Real-time Zero-Day Telemetry Stream',
              desc: 'Stream anonymous threat IOCs to global cloud surveillance mesh',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#141b2b] border border-[#232a3a] cursor-pointer hover:bg-[#232a3a]/60 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#dce2f7]">{item.label}</span>
                <span className="text-[10px] text-[#cbc3d7]">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={localConfig[item.key]}
                onChange={(e) => setLocalConfig({ ...localConfig, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded bg-[#2e3545] accent-[#a078ff] mt-0.5 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Threat Feeds Integration */}
      <section className="bg-[#191f2f] rounded-xl p-4 space-y-3 border border-[#232a3a]">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-sm font-bold text-[#dce2f7]">External Threat Intel Feeds</span>
          <span className="font-label-sm text-[10px] text-[#d0bcff] font-mono">4 CONNECTED</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'alienVault' as const, name: 'AlienVault OTX', delay: '12m update' },
            { key: 'virusTotal' as const, name: 'VirusTotal Intelligence', delay: 'Real-time API' },
            { key: 'phishTank' as const, name: 'PhishTank Community', delay: '5m update' },
            { key: 'cisaKnown' as const, name: 'CISA Known Exploited', delay: 'Hourly sync' },
          ].map((feed) => (
            <div
              key={feed.key}
              onClick={() =>
                setLocalConfig({
                  ...localConfig,
                  feeds: { ...localConfig.feeds, [feed.key]: !localConfig.feeds[feed.key] },
                })
              }
              className={`p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
                localConfig.feeds[feed.key]
                  ? 'bg-[#141b2b] border-[#4fdbc8]/40 text-[#dce2f7]'
                  : 'bg-[#070e1d] border-[#232a3a] text-[#958ea0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate">{feed.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    localConfig.feeds[feed.key] ? 'bg-[#4fdbc8]' : 'bg-[#494454]'
                  }`}
                />
              </div>
              <span className="text-[10px] text-[#958ea0] font-mono mt-1">{feed.delay}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SIEM / Webhooks Notifications */}
      <section className="bg-[#191f2f] rounded-xl p-4 space-y-3 border border-[#232a3a]">
        <span className="font-headline-sm text-sm font-bold text-[#dce2f7] block">
          SIEM & SOAR Dispatchers
        </span>
        <div className="space-y-2">
          {[
            { key: 'slack' as const, name: 'Slack #soc-urgent-alerts', icon: 'forum' },
            { key: 'splunk' as const, name: 'Splunk HEC Ingest Pipe', icon: 'dataset' },
            { key: 'sentinel' as const, name: 'Microsoft Sentinel Incident Bus', icon: 'cloud_sync' },
            { key: 'pagerduty' as const, name: 'PagerDuty P1 Escalation', icon: 'notifications_active' },
          ].map((hook) => (
            <div
              key={hook.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#141b2b] border border-[#232a3a]"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">{hook.icon}</span>
                <span className="text-xs font-semibold text-[#dce2f7]">{hook.name}</span>
              </div>
              <input
                type="checkbox"
                checked={localConfig.webhooks[hook.key]}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    webhooks: { ...localConfig.webhooks, [hook.key]: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded bg-[#2e3545] accent-[#a078ff] cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-[#a078ff] hover:bg-[#a078ff]/90 text-[#340080] font-headline-sm text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-[0.99]"
        >
          Save Configuration
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-xl bg-[#232a3a] hover:bg-[#323949] text-[#cbc3d7] font-label-md text-xs uppercase tracking-wider transition-all border border-[#232a3a]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
