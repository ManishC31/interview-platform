"use client";

import { Button } from "@/components/ui/button";

export default function Page() {
  const handleLeaveInterview = () => {};

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 py-3 shadow border-b">
        <h1 className="text-lg font-semibold text-primary">AssessHub</h1>
        <Button variant="destructive" size="sm" onClick={handleLeaveInterview}>
          Leave Interview
        </Button>
      </div>
    </div>
  );
}
