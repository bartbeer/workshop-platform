"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteOwnAccount } from "@/lib/actions/account-delete";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Verwijder mijn account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account en data verwijderen?</DialogTitle>
          <DialogDescription>
            Dit verwijdert je account en gekoppelde gegevens definitief uit het platform. Dit kan
            alleen als je geen toekomstige workshopinschrijvingen meer hebt en geen toekomstige
            sessies meer geeft als teacher.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Workshops in het verleden zijn geen probleem — als deelnemer of als teacher. Bij succesvolle
          verwijdering word je meteen uitgelogd.
        </div>

        <DialogFooter showCloseButton>
          <form action={deleteOwnAccount}>
            <Button
              type="submit"
              variant="destructive"
              onClick={() => setOpen(false)}
            >
              Ja, verwijder mijn account
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
