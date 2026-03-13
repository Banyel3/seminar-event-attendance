"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { selfEvaluate } from "@/app/actions";

type EvaluatedData = {
  name: string;
  email: string;
  section: string | null;
  course: string | null;
};

export default function EvaluatePage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [notPresent, setNotPresent] = useState(false);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [evaluated, setEvaluated] = useState<EvaluatedData | null>(null);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setTokenError(
        "Invalid evaluation link. Please ask the event organizer for the correct QR code.",
      );
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setNotRegistered(false);
    setNotPresent(false);
    setAlreadyEvaluated(false);

    try {
      const result = await selfEvaluate(email, token);
      if (result.error) {
        setError(result.error);
        if ((result as { notRegistered?: boolean }).notRegistered)
          setNotRegistered(true);
        if ((result as { notPresent?: boolean }).notPresent) setNotPresent(true);
        if ((result as { alreadyEvaluated?: boolean }).alreadyEvaluated)
          setAlreadyEvaluated(true);
      } else if (result.success && result.data) {
        setEvaluated(result.data);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-500/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8 text-red-300" />
            </div>
            <CardTitle className="text-white text-xl">
              Invalid Evaluation Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 text-sm text-center">{tokenError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (evaluated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-500/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-9 h-9 text-purple-200" />
            </div>
            <CardTitle className="text-2xl text-white drop-shadow">
              Review Done
            </CardTitle>
            <CardDescription className="text-purple-200 font-medium">
              Zero Trust Seminar Workshop · Mar 14, 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <div className="w-full bg-white/20 rounded-xl p-4 text-center border border-white/20">
              <p className="font-bold text-xl text-white">{evaluated.name}</p>
              <p className="text-sm text-white/70 mt-1">{evaluated.email}</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {evaluated.section && evaluated.course ? (
                  <>
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/30 text-purple-100 border border-purple-300/30"
                    >
                      {evaluated.section}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/30 text-purple-100 border border-purple-300/30"
                    >
                      {evaluated.course}
                    </Badge>
                  </>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/30 text-orange-200 border border-orange-400/30"
                  >
                    Guest
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-white/70 text-center">
              Thank you. Your evaluation is recorded and your certificate can now
              be processed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/15 backdrop-blur-md border border-white/25">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Image
              src="/ztfk-logo.png"
              alt="Zero Trust Fund Kids"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <p className="text-sm font-semibold tracking-wider text-purple-200 uppercase">
            Zero Trust Fund Kids
          </p>
          <CardTitle className="text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow">
            Seminar Evaluation
          </CardTitle>
          <CardDescription className="text-base text-white/70">
            Enter your registered email after completing the seminar review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className={`mb-5 ${
                alreadyEvaluated
                  ? "bg-purple-500/20 border-purple-400/40 text-purple-200"
                  : notPresent
                    ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                    : notRegistered
                      ? "bg-blue-500/20 border-blue-400/40 text-blue-200"
                      : "bg-red-500/20 border-red-400/40 text-red-200"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {alreadyEvaluated
                  ? "Already Evaluated"
                  : notPresent
                    ? "Attendance Required"
                    : notRegistered
                      ? "Not Registered"
                      : "Error"}
              </AlertTitle>
              <AlertDescription>
                {error}
                {notRegistered && (
                  <Link
                    href="/"
                    className="ml-1 underline font-semibold hover:opacity-80"
                  >
                    Sign up now →
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@wmsu.edu.ph"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/35 border-white/40 text-slate-900 placeholder:text-slate-500 focus-visible:ring-purple-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-900/40"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Evaluation"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-white/15 py-4 gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5 text-white/40" />
          <p className="text-xs text-white/50">
            Need to check in first?{" "}
            <Link
              href="/attend"
              className="underline text-white/70 hover:text-white"
            >
              Check status here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
