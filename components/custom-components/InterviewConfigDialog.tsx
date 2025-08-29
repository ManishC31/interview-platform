import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mic, Video, AlertTriangle, CloudCog, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function InterviewConfigDialog({ open, onClose, interviewId }: { open: boolean; onClose: () => void, interviewId: string }) {
  const [step, setStep] = useState(1);
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setStep(1);
      setAudioDevice(null);
      setCameraAvailable(null);
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  const handleDeviceAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('devices:', devices)

      const audioInput = devices.find((d) => d.kind === "audioinput");
      console.log('audioInput:', audioInput)

      setAudioDevice(audioInput || null);
      setCameraAvailable(true);

      stream.getTracks().forEach((track) => track.stop());
      setStep(3);
    } catch (err) {
      setError("Failed to access microphone or camera. Please allow permissions.");
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/interview/start/${interviewId}`);
      if (response.data.success) {
        router.push(`/interview/${interviewId}`);
      } else {
        // If API returns success: false
        toast.error("Failed to start the interview.");
      }
    } catch (error: any) {
      console.log("handle Continue error:", error);
      toast.error("Failed to start the interview.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (error) {
      return (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-red-50 border border-red-200">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              Configuration Failed
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
              {error}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setError("")}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-8 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-50 border border-blue-200">
                <Mic className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Microphone & Camera Setup
              </h2>
              <div className="space-y-3">
                <p className="text-gray-600 text-lg">
                  {audioDevice ? `Detected device: ${audioDevice.label}` : "Click continue to allow access."}
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Pro Tips:</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Use headphones for better audio, and sit in a well-lit room for clear video.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDeviceAccess}
              className="px-8 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue Setup
            </Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-50 border border-green-200">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                All Set!
              </h2>
              <p className="text-gray-600 text-lg">
                Audio and video devices are configured successfully.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Ready to go!</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Your interview environment is optimized and ready.
                </p>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={isLoading}
              className="px-8 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <CloudCog className="h-5 w-5 text-gray-600" />
              Interview Setup
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 pt-8">
            {renderStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
