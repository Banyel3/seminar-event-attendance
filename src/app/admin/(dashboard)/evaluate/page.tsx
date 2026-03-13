"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import {
  Loader2,
  Copy,
  CheckCheck,
  ExternalLink,
  ClipboardCheck,
  UserCheck,
  Award,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateEvalToken, getOverviewStats } from "@/app/admin/actions";

export default function AdminEvaluatePage() {
  const [mounted, setMounted] = useState(false);
  const [evalUrl, setEvalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    attended: number;
    evaluated: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const loadEvalQr = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateEvalToken();
      const url = `${window.location.origin}/evaluate?token=${encodeURIComponent(result.token)}`;
      setEvalUrl(url);
    } catch {
      toast.error("Failed to generate evaluation QR.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const s = await getOverviewStats();
      setStats({ attended: s.attended, evaluated: s.evaluated ?? 0 });
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadEvalQr();
    loadStats();
    const id = setInterval(loadStats, 10_000);
    return () => clearInterval(id);
  }, [mounted, loadEvalQr, loadStats]);

  const handleCopy = async () => {
    if (!evalUrl) return;
    await navigator.clipboard.writeText(evalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="h-72 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Evaluation QR
        </h1>
        <p className="text-slate-500 mt-1">
          Display this QR after the seminar review. Only participants already
          marked present can be marked as evaluated.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-emerald-200">
            <CardContent className="flex items-center gap-3 py-4">
              <UserCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.attended}
                </p>
                <p className="text-xs text-slate-500">Present</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="flex items-center gap-3 py-4">
              <Award className="w-5 h-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.evaluated}
                </p>
                <p className="text-xs text-slate-500">Evaluated</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Evaluation QR Code</CardTitle>
          </div>
          <CardDescription>
            This QR has no expiration and stays valid for evaluation marking.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-inner border border-slate-100">
            {loading || !evalUrl ? (
              <div
                className="flex items-center justify-center"
                style={{ width: 256, height: 256 }}
              >
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <QRCode
                value={evalUrl}
                size={256}
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            )}
          </div>

          {evalUrl && (
            <div className="w-full space-y-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Evaluation URL
              </p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-600 font-mono truncate flex-1">
                  {evalUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-slate-400 hover:text-purple-600 transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={evalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-slate-400 hover:text-purple-600 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
