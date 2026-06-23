"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { useCreateTicket } from "@/hooks/useTickets";

interface CreateTicketDialogProps {
  isDemo?: boolean;
}

const SUBJECT_GROUPS = [
  {
    category: "Billing",
    options: ["Payment failed", "Refund request", "Cancel subscription"],
  },
  {
    category: "Account",
    options: [
      "Account suspended",
      "Reset password",
      "Change email",
      "Add team member",
      "Data export",
    ],
  },
  {
    category: "Technical",
    options: ["API access issue"],
  },
  {
    category: "Feature Request",
    options: ["Upgrade plan"],
  },
  {
    category: "General",
    options: ["Security question", "Other"],
  },
];

export function CreateTicketDialog({ isDemo = false }: CreateTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const createTicket = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTicket.mutateAsync({ subject, body });
    setSubject("");
    setBody("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1" variant={isDemo ? "outline" : "default"}>
            <Plus className="h-4 w-4" />
            {isDemo ? "New Demo Ticket" : "New Ticket"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isDemo ? "Create Demo Ticket" : "Create New Ticket"}</DialogTitle>
        </DialogHeader>
        {isDemo && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Demo tickets are temporary and will be deleted after 30 minutes. They are only visible to you.</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select
              value={subject}
              onValueChange={(value) => value && setSubject(value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_GROUPS.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.category}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the issue..."
              rows={5}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
