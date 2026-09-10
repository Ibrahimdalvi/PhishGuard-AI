import { useEffect, useState } from 'react';

import { jsPDF } from 'jspdf';

import {
  analyzeUrl,
  ScanAnalysisResult,
} from '../utils/threatEngine';

interface NeuralUrlScannerProps {
  initialUrl?: string;
  onNavigateToLogs?: () => void;
  onNavigateToTips?: () => void;
  onShowToast: (
    msg: string,
    isAlert?: boolean
  ) => void;
}

type ScanHistoryRecord = {
  id: string;
  url: string;
  status: 'Phishing' | 'Suspicious' | 'Safe';
  risk: number;
  time: string;
  source: string;
  createdAt: string;
};

const STORAGE_KEY =
  'phishguard_scan_history';

export default function NeuralUrlScanner({
  initialUrl,
  onNavigateToLogs,
  onNavigateToTips,
  onShowToast,
}: NeuralUrlScannerProps) {

  const [urlInput, setUrlInput] =
    useState(initialUrl || '');

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState<ScanAnalysisResult | null>(
      null
    );

  const [quarantined, setQuarantined] =
    useState(false);

  useEffect(() => {
    if (initialUrl) {
      setUrlInput(initialUrl);
      setAnalysis(null);
      setQuarantined(false);
    }
  }, [initialUrl]);

  const normalizeUrl = (
    value: string
  ) => {

    const trimmed =
      value.trim();

    if (!trimmed) {
      return '';
    }

    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://')
    ) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const saveScanToHistory = (
    result: ScanAnalysisResult
  ) => {

    try {

      const savedHistory =
        localStorage.getItem(
          STORAGE_KEY
        );

      const existingHistory:
        ScanHistoryRecord[] =
        savedHistory
          ? JSON.parse(savedHistory)
          : [];

      const status:
        ScanHistoryRecord['status'] =
        result.verdict === 'malicious'
          ? 'Phishing'
          : result.verdict ===
            'suspicious'
            ? 'Suspicious'
            : 'Safe';

      const now =
        new Date();

      const newRecord:
        ScanHistoryRecord = {

        id:
          `SCAN-${Date.now()
            .toString()
            .slice(-8)}`,

        url:
          result.url,

        status,

        risk:
          result.score,

        time:
          now.toLocaleString(),

        source:
          'PhishGuard AI Scanner',

        createdAt:
          now.toISOString(),
      };

      const filteredHistory =
        existingHistory.filter(
          (record) =>
            record.url !==
            result.url
        );

      const updatedHistory = [
        newRecord,
        ...filteredHistory,
      ].slice(0, 100);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          updatedHistory
        )
      );

    } catch {

      // Scanner should continue working
      // even if localStorage fails.

    }

  };

  const handleScan = () => {

    const target =
      normalizeUrl(
        urlInput
      );

    if (!target) {

      onShowToast(
        'Please enter a URL to scan.',
        true
      );

      return;

    }

    try {

      new URL(target);

    } catch {

      onShowToast(
        'Please enter a valid URL.',
        true
      );

      return;

    }

    setUrlInput(target);

    setIsAnalyzing(true);

    setAnalysis(null);

    setQuarantined(false);

    setTimeout(() => {

      try {

        const result =
          analyzeUrl(target);

        setAnalysis(result);

        saveScanToHistory(
          result
        );

        onShowToast(
          `Scan completed: ${result.score}/100 (${result.verdictLabel})`,
          result.verdict ===
          'malicious'
        );

      } catch {

        onShowToast(
          'Unable to analyze this URL.',
          true
        );

      } finally {

        setIsAnalyzing(false);

      }

    }, 900);

  };

  const handlePaste =
    async () => {

      try {

        const text =
          await navigator.clipboard.readText();

        if (text) {

          setUrlInput(
            text.trim()
          );

          onShowToast(
            'URL pasted successfully.'
          );

        }

      } catch {

        onShowToast(
          'Clipboard access failed. Please paste manually.',
          true
        );

      }

    };

  const handleClear = () => {

    setUrlInput('');

    setAnalysis(null);

    setQuarantined(false);

  };

  const handleQuarantine = () => {

    if (!analysis) {
      return;
    }

    const nextState =
      !quarantined;

    setQuarantined(
      nextState
    );

    if (nextState) {

      onShowToast(
        `${analysis.host} added to local quarantine list.`,
        true
      );

    } else {

      onShowToast(
        `${analysis.host} removed from quarantine list.`
      );

    }

  };


  /* PDF REPORT DOWNLOAD */

  const handleExportReport = () => {

    if (!analysis) {

      onShowToast(
        'Scan a URL before exporting a report.',
        true
      );

      return;

    }

    try {

      const pdf =
        new jsPDF();

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      let y = 20;


      const checkPageSpace =
        (space: number = 15) => {

          if (
            y >
            pageHeight - space
          ) {

            pdf.addPage();

            y = 20;

          }

        };


      const addText = (
        text: string,
        size: number = 10,
        bold: boolean = false
      ) => {

        pdf.setFontSize(size);

        pdf.setFont(
          'helvetica',
          bold
            ? 'bold'
            : 'normal'
        );

        const lines =
          pdf.splitTextToSize(
            text,
            pageWidth - 30
          );

        lines.forEach(
          (line: string) => {

            checkPageSpace(
              size + 8
            );

            pdf.text(
              line,
              15,
              y
            );

            y +=
              size + 3;

          }
        );

      };


      /* HEADER */

      pdf.setFillColor(
        20,
        27,
        43
      );

      pdf.rect(
        0,
        0,
        pageWidth,
        38,
        'F'
      );

      pdf.setTextColor(
        79,
        219,
        200
      );

      pdf.setFontSize(20);

      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.text(
        'PHISHGUARD AI',
        15,
        17
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.text(
        'Intelligent Phishing Website Detection System',
        15,
        25
      );

      pdf.text(
        'Website Security Scan Report',
        15,
        32
      );


      y = 52;


      /* TEXT COLOR */

      pdf.setTextColor(
        30,
        30,
        30
      );


      /* SCAN INFORMATION */

      addText(
        'SCAN INFORMATION',
        15,
        true
      );

      y += 3;

      addText(
        `Scan Date: ${new Date().toLocaleString()}`
      );

      addText(
        `Scanned URL: ${analysis.url}`
      );

      addText(
        `Domain: ${analysis.host}`
      );


      y += 6;


      /* SECURITY VERDICT */

      addText(
        'SECURITY VERDICT',
        15,
        true
      );

      y += 3;

      addText(
        `Verdict: ${analysis.verdictLabel}`,
        12,
        true
      );

      addText(
        `Risk Score: ${analysis.score}/100`,
        12,
        true
      );

      addText(
        `Confidence: ${analysis.confidence}`
      );

      addText(
        `Assessment: ${analysis.threatBannerTitle}`
      );

      addText(
        analysis.threatBannerDesc
      );


      y += 6;


      /* DETECTION REASONS */

      addText(
        'DETECTION REASONS',
        15,
        true
      );

      y += 3;

      if (
        analysis.findings.length === 0
      ) {

        addText(
          'No major suspicious indicators were detected.'
        );

      } else {

        analysis.findings.forEach(
          (
            finding,
            index
          ) => {

            addText(
              `${index + 1}. ${finding.title} (${finding.severity})`,
              11,
              true
            );

            addText(
              finding.description
            );

            y += 2;

          }
        );

      }


      y += 6;


      /* URL FEATURE ANALYSIS */

      addText(
        'URL FEATURE ANALYSIS',
        15,
        true
      );

      y += 3;

      analysis.features.forEach(
        (
          feature,
          index
        ) => {

          addText(
            `${index + 1}. ${feature.label}: ${feature.value}`,
            11,
            true
          );

          addText(
            `Details: ${feature.description}`
          );

          addText(
            `Classification: ${feature.tag}`
          );

          y += 2;

        }
      );


      y += 6;


      /* SSL SECURITY */

      addText(
        'SSL SECURITY CHECK',
        15,
        true
      );

      y += 3;

      addText(
        `Status: ${analysis.tlsState.title}`,
        11,
        true
      );

      addText(
        `Trust Status: ${analysis.tlsState.trustStatus}`
      );

      addText(
        analysis.tlsState.description
      );


      y += 6;


      /* BRAND IMPERSONATION */

      addText(
        'BRAND IMPERSONATION ANALYSIS',
        15,
        true
      );

      y += 3;

      addText(
        `Detected Brand: ${analysis.targetBrand ||
        'No brand detected'
        }`
      );

      addText(
        `Similarity Score: ${analysis.similarity ||
        '0%'
        }`
      );


      y += 10;


      /* FOOTER */

      checkPageSpace(
        25
      );

      pdf.setFontSize(9);

      pdf.setTextColor(
        100,
        100,
        100
      );

      pdf.text(
        'Generated by PhishGuard AI - Intelligent Phishing Website Detection System',
        15,
        y
      );


      /* SAVE PDF */

      pdf.save(
        `phishguard-security-report-${Date.now()}.pdf`
      );


      onShowToast(
        'PDF security report downloaded successfully.'
      );

    } catch (error) {

      console.error(
        'PDF generation error:',
        error
      );

      onShowToast(
        'Unable to generate PDF report.',
        true
      );

    }

  };


  const getVerdictColor = () => {

    if (!analysis) {
      return 'text-[#958ea0]';
    }

    if (
      analysis.verdict ===
      'malicious'
    ) {
      return 'text-[#ff5451]';
    }

    if (
      analysis.verdict ===
      'suspicious'
    ) {
      return 'text-[#f59e0b]';
    }

    return 'text-[#4fdbc8]';

  };

  const getVerdictBackground = () => {

    if (!analysis) {
      return 'bg-[#191f2f] border-[#232a3a]';
    }

    if (
      analysis.verdict ===
      'malicious'
    ) {
      return 'bg-red-950/30 border-red-500/40';
    }

    if (
      analysis.verdict ===
      'suspicious'
    ) {
      return 'bg-orange-950/30 border-orange-500/40';
    }

    return 'bg-teal-950/30 border-teal-500/40';

  };

  const circumference =
    314.159;

  const strokeOffset =
    analysis
      ? circumference -
      (analysis.score / 100) *
      circumference
      : circumference;

  return (

    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-4 gap-6 text-[#dce2f7]">

      {/* HEADER */}

      <section className="flex flex-col gap-4">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">

              <span className="material-symbols-outlined text-[#4fdbc8]">
                travel_explore
              </span>

            </div>

            <div>

              <h1 className="text-lg font-bold text-white">
                URL Scanner
              </h1>

              <p className="text-xs text-[#958ea0]">
                Analyze suspicious websites for phishing threats.
              </p>

            </div>

          </div>

          <span className="font-mono text-[10px] text-[#4fdbc8] px-3 py-1.5 bg-[#4fdbc8]/10 border border-[#4fdbc8]/20 rounded-full whitespace-nowrap">
            PHISHGUARD AI
          </span>

        </div>


        {/* URL INPUT */}

        <div className="relative flex items-center bg-[#070e1d] rounded-xl shadow-lg p-2 border border-[#232a3a] focus-within:border-[#a078ff] transition-all">

          <span className="material-symbols-outlined text-[#4fdbc8] text-[20px] ml-2">
            link
          </span>

          <input
            type="text"
            value={urlInput}
            onChange={(event) =>
              setUrlInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {

              if (
                event.key ===
                'Enter'
              ) {

                handleScan();

              }

            }}
            placeholder="Paste a suspicious URL here..."
            className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-[#958ea0]"
          />

          {urlInput && (

            <button
              type="button"
              onClick={
                handleClear
              }
              className="w-8 h-8 flex items-center justify-center text-[#958ea0] hover:text-white transition-colors"
            >

              <span className="material-symbols-outlined">
                close
              </span>

            </button>

          )}

        </div>


        {/* BUTTONS */}

        <div className="flex flex-col sm:flex-row gap-3">

          <button
            type="button"
            onClick={
              handlePaste
            }
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#191f2f] hover:bg-[#232a3a] border border-[#232a3a] rounded-xl text-sm font-medium transition-all"
          >

            <span className="material-symbols-outlined text-[18px]">
              content_paste
            </span>

            Paste URL

          </button>


          <button
            type="button"
            onClick={
              handleScan
            }
            disabled={
              isAnalyzing
            }
            className="flex-[1.5] h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#14b8a6] hover:brightness-110 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >

            <span
              className={`material-symbols-outlined ${isAnalyzing
                  ? 'animate-spin'
                  : ''
                }`}
            >

              {isAnalyzing
                ? 'refresh'
                : 'radar'}

            </span>

            {isAnalyzing
              ? 'Analyzing...'
              : 'Scan Website'}

          </button>

        </div>


        {/* SECURITY TIPS QUICK ACCESS */}

        <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/30 via-[#141b2b] to-[#141b2b] p-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">

                <span className="material-symbols-outlined text-purple-300">
                  lightbulb
                </span>

              </div>

              <div>

                <h3 className="text-sm font-bold text-white">
                  Security Tips & Awareness
                </h3>

                <p className="text-xs text-[#958ea0] mt-1">
                  Learn how to identify phishing websites and protect yourself online.
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() => {

                if (
                  onNavigateToTips
                ) {

                  onNavigateToTips();

                } else {

                  onShowToast(
                    'Security Tips navigation is not configured.',
                    true
                  );

                }

              }}
              className="shrink-0 h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >

              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>

              View Security Tips

            </button>

          </div>

        </section>

      </section>


      {/* EMPTY STATE */}

      {!analysis &&
        !isAnalyzing && (

          <section className="rounded-2xl bg-[#141b2b] border border-[#232a3a] min-h-[380px] flex flex-col items-center justify-center text-center p-8">

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/20 flex items-center justify-center mb-5">

              <span className="material-symbols-outlined text-4xl text-[#a078ff]">
                shield
              </span>

            </div>

            <h2 className="text-xl font-bold text-white">
              Ready to Scan
            </h2>

            <p className="text-sm text-[#958ea0] max-w-md mt-3">
              Enter a website URL above to analyze phishing indicators,
              risk score, security findings, SSL status and brand
              impersonation.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 w-full max-w-3xl">

              {[
                'URL Analysis',
                'Risk Score',
                'SSL Check',
                'Brand Detection',
              ].map(
                (item) => (

                  <div
                    key={item}
                    className="bg-[#191f2f] border border-[#232a3a] rounded-xl p-3 text-xs text-[#cbc3d7]"
                  >
                    {item}
                  </div>

                )
              )}

            </div>

          </section>

        )}


      {/* LOADING */}

      {isAnalyzing && (

        <section className="rounded-2xl bg-[#141b2b] border border-[#232a3a] min-h-[380px] flex flex-col items-center justify-center text-center p-8">

          <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-5" />

          <h2 className="text-xl font-bold text-white">
            Analyzing Website
          </h2>

          <p className="text-sm text-[#958ea0] mt-3">
            Checking URL features and phishing indicators...
          </p>

        </section>

      )}


      {/* RESULTS */}

      {analysis &&
        !isAnalyzing && (

          <>

            {/* VERDICT */}

            <section
              className={`rounded-xl border p-5 ${getVerdictBackground()}`}
            >

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl bg-[#070e1d] flex items-center justify-center ${getVerdictColor()}`}
                >

                  <span className="material-symbols-outlined text-[28px]">

                    {analysis.verdict ===
                      'malicious'
                      ? 'gpp_maybe'
                      : analysis.verdict ===
                        'suspicious'
                        ? 'warning'
                        : 'verified'}

                  </span>

                </div>

                <div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${getVerdictColor()}`}
                  >

                    {analysis.verdictLabel}

                  </span>

                  <h2 className="text-lg font-bold text-white mt-1">
                    {analysis.threatBannerTitle}
                  </h2>

                  <p className="text-sm text-[#cbc3d7] mt-2">
                    {analysis.threatBannerDesc}
                  </p>

                </div>

              </div>

            </section>


            {/* RISK SCORE */}

            <section className="bg-[#191f2f] rounded-2xl p-5 border border-[#232a3a]">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h2 className="text-base font-bold text-white">
                    Risk Score
                  </h2>

                  <p className="text-xs text-[#958ea0] mt-1">
                    AI-based threat assessment
                  </p>

                </div>

                <span
                  className={`text-xs font-bold uppercase ${getVerdictColor()}`}
                >

                  {analysis.verdictLabel}

                </span>

              </div>


              <div className="flex flex-col items-center">

                <div className="relative w-48 h-48">

                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 120 120"
                  >

                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#232a3a"
                      strokeWidth="9"
                    />

                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={
                        circumference
                      }
                      strokeDashoffset={
                        strokeOffset
                      }
                      className={
                        getVerdictColor()
                      }
                    />

                  </svg>


                  <div className="absolute inset-0 flex flex-col items-center justify-center">

                    <span
                      className={`text-4xl font-bold ${getVerdictColor()}`}
                    >
                      {analysis.score}
                    </span>

                    <span className="text-[10px] text-[#958ea0] uppercase">
                      Out of 100
                    </span>

                  </div>

                </div>


                <p className="text-sm text-[#cbc3d7] mt-3">
                  Confidence:{' '}
                  {analysis.confidence}
                </p>

              </div>


              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

                <div className="bg-[#141b2b] border border-[#232a3a] rounded-xl p-3 text-center">

                  <p className="text-[10px] uppercase text-[#958ea0]">
                    Domain Age
                  </p>

                  <p className="text-sm font-bold text-white mt-1">
                    {analysis.domainAge}
                  </p>

                  <p className="text-[10px] text-[#4fdbc8]">
                    {analysis.domainAgeLabel}
                  </p>

                </div>


                <div className="bg-[#141b2b] border border-[#232a3a] rounded-xl p-3 text-center">

                  <p className="text-[10px] uppercase text-[#958ea0]">
                    Heuristics
                  </p>

                  <p className="text-sm font-bold text-white mt-1">
                    {analysis.heuristicsPercent}
                  </p>

                  <p className="text-[10px] text-[#4fdbc8]">
                    {analysis.heuristicsLabel}
                  </p>

                </div>


                <div className="bg-[#141b2b] border border-[#232a3a] rounded-xl p-3 text-center">

                  <p className="text-[10px] uppercase text-[#958ea0]">
                    Clone Match
                  </p>

                  <p className="text-sm font-bold text-white mt-1">
                    {analysis.cloneMatchPercent}
                  </p>

                  <p className="text-[10px] text-[#4fdbc8]">
                    {analysis.cloneMatchLabel}
                  </p>

                </div>

              </div>

            </section>


            {/* DETECTION REASONS */}

            <section>

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h2 className="text-base font-bold text-white">
                    Detection Reasons
                  </h2>

                  <p className="text-xs text-[#958ea0]">
                    Security findings detected during analysis
                  </p>

                </div>

                <span className="text-xs text-[#958ea0]">
                  {analysis.findings.length}
                  {' '}
                  findings
                </span>

              </div>


              <div className="space-y-3">

                {analysis.findings.map(
                  (finding) => (

                    <div
                      key={finding.id}
                      className="flex gap-4 p-4 rounded-xl bg-[#191f2f] border border-[#232a3a]"
                    >

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${finding.severity ===
                            'CRITICAL' ||
                            finding.severity ===
                            'HIGH'
                            ? 'bg-red-500/15 text-red-400'
                            : finding.severity ===
                              'SUSPICIOUS'
                              ? 'bg-orange-500/15 text-orange-400'
                              : 'bg-teal-500/15 text-teal-400'
                          }`}
                      >

                        <span className="material-symbols-outlined">
                          {finding.icon}
                        </span>

                      </div>


                      <div className="flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <h3 className="text-sm font-semibold text-white">
                            {finding.title}
                          </h3>

                          <span className="text-[10px] text-[#958ea0]">
                            {finding.severity}
                          </span>

                        </div>

                        <p className="text-xs text-[#cbc3d7] mt-2">
                          {finding.description}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>


            {/* URL FEATURE ANALYSIS */}

            <section>

              <div className="mb-4">

                <h2 className="text-base font-bold text-white">
                  URL Feature Analysis
                </h2>

                <p className="text-xs text-[#958ea0]">
                  Technical characteristics detected from the URL
                </p>

              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {analysis.features.map(
                  (feature) => (

                    <div
                      key={feature.id}
                      className="p-4 rounded-xl bg-[#141b2b] border border-[#232a3a]"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <span className="text-xs text-[#958ea0]">
                          {feature.label}
                        </span>

                        <span className="text-[10px] text-[#4fdbc8]">
                          {feature.tag}
                        </span>

                      </div>

                      <p className="text-sm font-semibold text-white mt-2">
                        {feature.value}
                      </p>

                      <p className="text-xs text-[#958ea0] mt-1">
                        {feature.description}
                      </p>

                    </div>

                  )
                )}

              </div>

            </section>


            {/* SSL SECURITY */}

            <section className="bg-[#191f2f] rounded-2xl p-5 border border-[#232a3a] space-y-6">

              <div>

                <h2 className="text-base font-bold text-white">
                  SSL Security Check
                </h2>

                <p className="text-xs text-[#958ea0] mt-1">
                  TLS certificate and connection inspection
                </p>

              </div>


              <div className="p-4 rounded-xl bg-[#141b2b] border border-[#232a3a]">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">

                    <span className="material-symbols-outlined">
                      lock
                    </span>

                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-white">
                      {analysis.tlsState.title}
                    </h3>

                    <p className="text-xs text-[#4fdbc8]">
                      {analysis.tlsState.trustStatus}
                    </p>

                  </div>

                </div>

                <p className="text-xs text-[#cbc3d7] mt-4">
                  {analysis.tlsState.description}
                </p>

              </div>


              {/* BRAND DETECTION */}

              <div>

                <h2 className="text-base font-bold text-white">
                  Brand Impersonation Detection
                </h2>

                <p className="text-xs text-[#958ea0] mt-1">
                  Check for potential brand spoofing or typosquatting
                </p>

              </div>


              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#141b2b] border border-[#232a3a]">

                <div>

                  <p className="text-sm font-semibold text-white">
                    {analysis.targetBrand ||
                      'No brand detected'}
                  </p>

                  <p className="text-xs text-[#958ea0] mt-1">
                    Brand similarity analysis
                  </p>

                </div>


                <div className="text-right">

                  <p
                    className={`text-xl font-bold ${getVerdictColor()}`}
                  >
                    {analysis.similarity ||
                      '0%'}
                  </p>

                  <p className="text-[10px] text-[#958ea0]">
                    Similarity
                  </p>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    handleQuarantine
                  }
                  className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${quarantined
                      ? 'bg-teal-500 text-[#062b28]'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                >

                  <span className="material-symbols-outlined">

                    {quarantined
                      ? 'check_circle'
                      : 'block'}

                  </span>

                  {quarantined
                    ? 'Domain Quarantined'
                    : 'Quarantine Domain'}

                </button>


                {/* PDF DOWNLOAD */}

                <button
                  type="button"
                  onClick={
                    handleExportReport
                  }
                  className="flex-1 h-11 rounded-xl bg-[#232a3a] hover:bg-[#323949] text-white border border-[#323949] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >

                  <span className="material-symbols-outlined">
                    picture_as_pdf
                  </span>

                  Download PDF Report

                </button>

              </div>

            </section>

          </>

        )}

    </div>

  );

}