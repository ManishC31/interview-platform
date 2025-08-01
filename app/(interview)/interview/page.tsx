"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useRouter } from "next/navigation";

export default function Configuration() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState("");
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  useEffect(() => {
    initAudioAccess();
    initCameraAccess();
  }, []);

  const initAudioAccess = async () => {
    try {
      setLoading(true);

      // Always request media stream first — works across desktop & mobile
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter((d) => d.kind === "audiooutput");

      const defaultOutput = audioOutputs.find((d) => d.deviceId === "default") || audioOutputs[0];

      console.log("defaultOutput:", defaultOutput);
      if (!defaultOutput) {
        setError("No audio output device found.");
      } else {
        setAudioDevice(defaultOutput);
      }

      // Clean up mic stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      setError("Failed to access microphone. Please allow permission.");
    } finally {
      setLoading(false);
    }
  };

  const initCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      setCameraError("Failed to access the camera of device.");
      console.error("Camera access denied or not available:", error);
      return null;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Show confirmation modal before allowing exit
        setShowExitPrompt(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setShowExitPrompt(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const confirmExit = () => {
    setShowExitPrompt(false);
    router.replace("/");
  };

  const cancelExit = () => {
    setShowExitPrompt(false);
    // Optionally re-enter fullscreen if needed
    goFullscreen();
  };

  const goFullscreen = () => {
    const elem = document.documentElement; // or any specific element
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen(); // Safari
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen(); // IE11
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Tab/window switched or minimized
        setShowExitPrompt(true); // Show modal or warning
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:gap-6">
        {/* Audio Card */}
        <Card className="w-full md:w-1/2 mb-6 md:mb-0 shadow-2xl border border-gray-300 dark:border-gray-700 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl">Audio Configuration</CardTitle>
            <CardDescription>Test and verify your microphone setup.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Audio Test Section */}
            <div>
              <h3 className="text-lg font-semibold">Test Setup</h3>
              {loading ? (
                <div className="flex items-center space-x-3 animate-pulse text-muted-foreground">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Fetching audio devices...</span>
                </div>
              ) : error ? (
                <div className="text-center">
                  <p className="text-red-600">{error}</p>
                  <Button className="mt-4 px-6" variant="destructive" onClick={initAudioAccess}>
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-sm text-muted-foreground">Default Audio Output Device:</h3>
                  <p className="font-medium mt-1">{audioDevice?.label || "Unknown Device"}</p>
                </>
              )}
            </div>

            {/* Audio Suggestions Section */}
            <div>
              <h3 className="text-lg font-semibold">Suggestions</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>🎧 Use a headset or microphone for better audio quality.</li>
                <li>🔇 Stay in a quiet environment to reduce noise.</li>
                <li>📶 Ensure a stable internet connection.</li>
                <li>🧪 Test your mic before starting the interview.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Video Card */}
        <Card className="w-full md:w-1/2 shadow-2xl border border-gray-300 dark:border-gray-700 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl">Video Configuration</CardTitle>
            <CardDescription>Preview and verify your camera setup.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center space-x-3 animate-pulse text-muted-foreground">
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Fetching camera permission...</span>
              </div>
            ) : cameraError ? (
              <div className="text-center">
                <p className="text-red-600">{cameraError}</p>
                <Button className="mt-4 px-6" variant="destructive" onClick={initCameraAccess}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-auto rounded-xl border border-muted shadow-md" autoPlay muted playsInline />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Centered Continue Button */}
      <div className="mt-10 flex justify-center">
        <Button size="lg" className="px-8 py-6 text-base font-semibold" onClick={goFullscreen}>
          Continue to Interview
        </Button>
      </div>

      <AlertDialog open={showExitPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Fullscreen Detected</AlertDialogTitle>
            <AlertDialogDescription>Exiting fullscreen or switching tabs will terminate your test. Do you want to continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={cancelExit}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Okay, Exit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
