"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("demouser@personalos.local");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      // name: "Demo User",
      email: email,
      password: "Demo#12345",
      callbackURL: "/",
    })
    console.log(data, error)
    if (error?.code == "INVALID_EMAIL_OR_PASSWORD") {
      const { data, error } = await authClient.signUp.email({
        name: "Demo User",
        email: email,
        password: "Demo#12345",
        callbackURL: "/",
      })
      console.log(data, error)
    }
    setLoading(false);
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    const { data, error } = await authClient.signIn.social({
      provider: "github",
    })
    if (data) {
      setLoading(false)
    }
    if (error) {
      setLoading(false)
    }
    console.log(data, error)
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>Personal OS Authentication</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your private workspace and tasks.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive shadow-xs">
            <ShieldAlert className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">
                {error === "OAuthSignin" || error === "OAuthCallback"
                  ? "Failed to authenticate with provider. Please try demo login."
                  : "An unexpected error occurred. Please try again."}
              </p>
            </div>
          </div>
        )}

        <Card className="border-border/80 shadow-lg backdrop-blur-xl bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to Personal OS</CardTitle>
            <CardDescription>
              Choose your preferred method to sign in to your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 justify-center gap-3 font-medium hover:bg-accent/80 transition-colors"
              onClick={handleGithubSignIn}
              disabled={loading}
            >
              <svg className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  Or continue with email / demo
                </span>
              </div>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="demouser@personalos.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-medium gap-2 shadow-sm"
                disabled={loading}
              >
                <span>{loading ? "Signing in..." : "Continue to Workspace"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground border-t bg-muted/20 pt-4 rounded-b-xl">
            <p>Protected by multi-tenant workspace isolation.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
