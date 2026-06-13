"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type SubmitTeacherApplicationState,
  submitTeacherApplication,
} from "@/lib/actions/teacher-application";

export function TeacherApplicationForm() {
  const [state, formAction, pending] = useActionState<
    SubmitTeacherApplicationState,
    FormData
  >(submitTeacherApplication, undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {state?.error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="workshop_type">Type workshop</Label>
        <Input id="workshop_type" name="workshop_type" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience">Ervaring</Label>
        <Textarea id="experience" name="experience" rows={4} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="motivation">Motivatie</Label>
        <Textarea id="motivation" name="motivation" rows={4} required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Versturen…" : "Aanvraag indienen"}
      </Button>
    </form>
  );
}
