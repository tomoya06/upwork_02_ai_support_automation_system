import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Bot className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          AI Support Automation Engine
        </h1>

        <p className="text-lg text-muted-foreground">
          An AI-powered customer support automation system that classifies
          incoming tickets, retrieves relevant knowledge, generates responses,
          and recommends resolution actions.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/inbox">
            <Button size="lg" className="gap-2">
              Open Inbox <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/knowledge">
            <Button size="lg" variant="outline">
              Manage Knowledge
            </Button>
          </Link>
          <Link href="/showcase">
            <Button size="lg" variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              View Showcase
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
