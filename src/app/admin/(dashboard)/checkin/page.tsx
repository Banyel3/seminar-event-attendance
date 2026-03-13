"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import {
  RefreshCcw,
  Loader2,
  Copy,
  CheckCheck,
  ExternalLink,
  Users,
  UserCheck,
  QrCode,
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
import { generateCheckinToken, getOverviewStats } from "@/app/admin/actions";

export default function AdminCheckinPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [checkinUrl, setCheckinUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    totalRegistered: number;
    attended: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateCheckinToken();
      const url = `${window.location.origin}/checkin?token=${encodeURIComponent(result.token)}`;
      setToken(result.token);
      setCheckinUrl(url);
    } catch {
      toast.error("Failed to generate QR code.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const s = await getOverviewStats();
      setStats({ totalRegistered: s.totalRegistered, attended: s.attended });
    } catch {
      /* ignore */
    }
  }, []);

  // Generate on mount + auto-refresh stats every 10 s
  useEffect(() => {
    if (!mounted) return;
    generate();
    loadStats();
    const id = setInterval(loadStats, 10_000);
    return () => clearInterval(id);
  }, [mounted, generate, loadStats]);

  const handleCopy = async () => {
    if (!checkinUrl) return;
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SSR skeleton
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Self Check-In QR
        </h1>
        <p className="text-slate-500 mt-1">
          Display this QR code on-screen. Participants scan it with their phone
          and enter their email to be marked present instantly.
        </p>
      </div>

      {/* Live stats strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalRegistered}
                </p>
                <p className="text-xs text-slate-500">Registered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardContent className="flex items-center gap-3 py-4">
              <UserCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.attended}
                </p>
                <p className="text-xs text-slate-500">Checked In</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">Check-In QR Code</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generate}
              disabled={generating}
              className="gap-1.5 text-xs"
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCcw className="h-3 w-3" />
              )}
              Regenerate
            </Button>
          </div>
          <CardDescription>
            Valid for 12 hours. Click &ldquo;Regenerate&rdquo; to issue a fresh
            QR.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* QR Code */}
          <div className="bg-white rounded-2xl p-6 shadow-inner border border-slate-100">
            {generating || !checkinUrl ? (
              <div
                className="flex items-center justify-center"
                style={{ width: 256, height: 256 }}
              >
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <QRCode
                value={checkinUrl}
                size={256}
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            )}
          </div>

          {/* URL display */}
          {checkinUrl && (
            <div className="w-full space-y-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Check-In URL
              </p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-600 font-mono truncate flex-1">
                  {checkinUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={checkinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-slate-100 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>Display this QR code on a projector or screen at the venue.</li>
            <li>Participants open their phone camera and scan the QR code.</li>
            <li>
              They enter the email address they registered with and tap{" "}
              <strong>Check In</strong>.
            </li>
            <li>
              Their attendance is recorded instantly — no admin action needed.
            </li>
            <li>
              The QR expires after 12 hours. Click <strong>Regenerate</strong>{" "}
              to get a fresh one at any time.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
