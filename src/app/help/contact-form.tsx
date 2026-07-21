"use client";

import { useState, useTransition } from "react";
import { submitSupportTicket } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitSupportTicket(formData);
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Terjadi kesalahan, coba lagi.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-muted p-4 text-sm">
        Pesan kamu sudah terkirim. Tim kami akan merespons dalam 1x24 jam.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        name="email"
        placeholder="Email kamu"
        defaultValue={defaultEmail}
        required
      />
      <textarea
        name="message"
        placeholder="Tulis pertanyaan atau kendala kamu di sini"
        required
        rows={4}
        className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
      {status === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Mengirim..." : "Kirim pesan"}
      </Button>
    </form>
  );
}
