"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-lg font-medium">Masuk ke BelajarSQL</p>
          <p className="text-sm text-muted-foreground">
            Daftar otomatis lewat akun Google atau GitHub kamu.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: next })}
          >
            Lanjutkan dengan Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: next })}
          >
            Lanjutkan dengan GitHub
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Dengan masuk, kamu menyetujui Ketentuan Layanan dan Kebijakan
            Privasi kami.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
