"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cancelSessionByOwner } from "@/lib/actions/cancel-session";

export function CancelSessionButton({
  sessionId,
  workshopId,
  disabled,
}: {
  sessionId: string;
  workshopId: string;
  disabled?: boolean;
}) {
  return (
    <form action={cancelSessionByOwner}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="workshop_id" value={workshopId} />
      <SubmitButton disabled={disabled} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      disabled={disabled || pending}
      className="rounded-none"
    >
      {pending ? "Annuleren…" : "Sessie annuleren"}
    </Button>
  );
}
