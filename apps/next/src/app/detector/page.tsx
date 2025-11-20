import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIDetector } from "../components/ai-detector";
import { EvaluationDashboard } from "../components/evaluation-dashboard";

export const metadata: Metadata = {
  title: "AI Content Detector | Humanize",
  description:
    "Detect AI-generated content and evaluate humanization effectiveness with multiple detection algorithms",
};

export default function DetectorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="font-bold text-4xl tracking-tight">
          AI Content Detector
        </h1>
        <p className="text-lg text-muted-foreground">
          Analyze text to detect AI-generated content and evaluate humanization
          effectiveness
        </p>
      </div>

      <Tabs className="space-y-6" defaultValue="detector">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="detector">AI Detector</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="detector">
          <AIDetector />
        </TabsContent>

        <TabsContent className="space-y-4" value="evaluation">
          <EvaluationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
