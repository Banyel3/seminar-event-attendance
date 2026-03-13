import Link from "next/link";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { CheckCircle2, AlertCircle, Copy } from "lucide-react";

interface Props {
  searchParams: Promise<{ code?: string; error?: string }>;
}

export default async function GoogleAuthCallbackPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-red-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <h1 className="font-bold">Authorization Denied</h1>
          </div>
          <p className="text-sm text-slate-600">
            Google returned an error:{" "}
            <span className="font-mono text-red-600 text-xs">{params.error}</span>
          </p>
          <Link
            href="/admin/google-auth"
            className="inline-block text-sm text-blue-600 underline mt-2"
          >
            ← Try again
          </Link>
        </div>
      </div>
    );
  }

  if (!params.code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-amber-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            <h1 className="font-bold">No authorization code</h1>
          </div>
          <p className="text-sm text-slate-600">
            This page should only be accessed after the Google OAuth flow. No code was found
            in the URL.
          </p>
          <Link
            href="/admin/google-auth"
            className="inline-block text-sm text-blue-600 underline mt-2"
          >
            ← Go back
          </Link>
        </div>
      </div>
    );
  }

  let refreshToken: string | null = null;
  let exchangeError: string | null = null;

  try {
    const result = await exchangeCodeForTokens(params.code);
    refreshToken = result.refreshToken;
    if (!refreshToken) {
      exchangeError =
        "Google returned an access token but no refresh token. This can happen if you already authorized this app before — revoke access at myaccount.google.com/permissions and try again.";
    }
  } catch (err) {
    exchangeError = String(err);
  }

  if (exchangeError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-red-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <h1 className="font-bold">Token exchange failed</h1>
          </div>
          <p className="text-sm text-slate-600 break-words">{exchangeError}</p>
          <Link
            href="/admin/google-auth"
            className="inline-block text-sm text-blue-600 underline mt-2"
          >
            ← Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Authorization successful!</p>
              <p className="text-sm text-emerald-700 mt-1">
                Copy the refresh token below and add it to your{" "}
                <code className="bg-emerald-100 px-1 rounded text-xs">.env</code> file.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Copy className="w-4 h-4" />
            Your Refresh Token
          </div>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-emerald-400 break-all select-all">
            {refreshToken}
          </div>
          <p className="text-xs text-slate-500">
            Add this to your <code className="bg-slate-100 px-1 rounded">.env</code>:
          </p>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 break-all select-all">
            GOOGLE_REFRESH_TOKEN=&quot;{refreshToken}&quot;
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 space-y-1">
          <p className="font-semibold">Important — keep this safe</p>
          <ul className="list-disc list-inside text-xs space-y-1 mt-1">
            <li>This token grants access to create and edit calendar events on your account.</li>
            <li>Never commit it to version control.</li>
            <li>This page only shows it once — save it now.</li>
            <li>After adding it to .env, redeploy, then return to verify connection status.</li>
          </ul>
        </div>

        <Link
          href="/admin/google-meet"
          className="block text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Continue to Google Meet Setup →
        </Link>
      </div>
    </div>
  );
}
