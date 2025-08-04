"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InterviewConfigDialog from "@/components/custom-components/InterviewConfigDialog";
import { Button } from "../ui/button";

export const Hero = () => {
  const router = useRouter();
  const [isResumeFound, setIsResumeFound] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="w-full min-h-screen flex items-center justify-center px-4 py-20 md:py-32 bg-background text-foreground">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Welcome to <span className="bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">AssessHub</span>,{" "}
          <span className="bg-gradient-to-r from-[#61DAFB] via-[#1fc0f1] to-[#03a3d7] text-transparent bg-clip-text">Manish</span>
        </h1>

        {/* Updated Description */}
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          You’ve been invited to participate in a formal interview. Please upload your resume to begin the interview process.
        </p>

        {/* CTA Button */}
        {isResumeFound ? (
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button className="w-full sm:w-auto px-6 py-3 text-base font-medium">View Existing Resume</Button>
            <Button className="w-full sm:w-auto px-6 py-3 text-base font-medium">Upload Another Resume</Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button className="w-full sm:w-auto px-6 py-3 text-base font-medium">Upload Resume</Button>
          </div>
        )}

        <Button onClick={() => setDialogOpen(true)}>Start Interview</Button>
        <InterviewConfigDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </div>
    </section>
  );
};
