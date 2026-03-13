import Link from "next/link";
import { generateAuthUrl } from "@/lib/google-calendar";
import { ShieldCheck, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

export default function GoogleAuthPage() {
  const isConnected = !!process.env.GOOGLE_REFRESH_TOKEN?.trim();
  const authUrl = generateAuthUrl();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-800">Google Account Authorization</h1>
        </div>

        {isConnected ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">Google account is connected</p>
                <p className="text-sm text-emerald-700 mt-1">
                  A refresh token is present in your environment. You can now create and manage
                  the Google Meet event from the{" "}
                  <Link href="/admin/google-meet" className="underline font-medium">
                    Google Meet page
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Not yet authorized</p>
                <p className="text-sm text-amber-700 mt-1">
                  GOOGLE_REFRESH_TOKEN is not set. Complete the steps below to connect your
                  Google account.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            How to get your Refresh Token
          </h2>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">1</span>
              <span>
                Make sure <code className="bg-slate-100 px-1 rounded text-xs">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">GOOGLE_CLIENT_SECRET</code>, and{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">GOOGLE_REDIRECT_URI</code> are all
                set in your <code className="bg-slate-100 px-1 rounded text-xs">.env</code> file.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">2</span>
              <span>
                Click the button below to open Google&apos;s consent screen. Sign in with the Google
                account that owns the calendar you want to use.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">3</span>
              <span>
                After approving, you&apos;ll be redirected back here and shown your{" "}
                <strong>refresh token</strong>. Copy it and add it to your <code className="bg-slate-100 px-1 rounded text-xs">.env</code>:{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">GOOGLE_REFRESH_TOKEN=&quot;...&quot;</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">4</span>
              <span>Redeploy or restart the server, then return to this page — it will show connected.</span>
            </li>
          </ol>
        </div>

        <a
          href={authUrl}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Authorize with Google
        </a>

        <p className="text-xs text-slate-400 text-center">
          This grants calendar event access only. No email or drive access is requested.
        </p>
      </div>
    </div>
  );
}
