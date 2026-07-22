"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "Configuration":
        return "There is a problem with the server configuration. Please check that Auth secrets and providers are configured correctly.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in with this account.";
      case "Verification":
        return "The verification link has expired or has already been used.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return "Could not log in with the authentication provider. Please try demo email login.";
      default:
        return "An unknown authentication error occurred. Please try signing in again.";
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-destructive/30 shadow-lg bg-card">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <CardTitle className="text-xl">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
            {error && (
              <p className="text-xs font-mono bg-muted p-2 rounded-lg text-muted-foreground">
                Error Code: {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link href="/auth/signin">
                <RefreshCw className="size-4" />
                Try Signing In Again
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full gap-2 text-xs">
              <Link href="/">
                <ArrowLeft className="size-3.5" />
                Return to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
