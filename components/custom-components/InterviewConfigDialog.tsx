import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mic, Video, AlertTriangle, CloudCog } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InterviewConfigDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setStep(1);
      setAudioDevice(null);
      setCameraAvailable(null);
      setError("");
    }
  }, [open]);

  const handleDeviceAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInput = devices.find((d) => d.kind === "audioinput");
      setAudioDevice(audioInput || null);
      setCameraAvailable(true);

      stream.getTracks().forEach((track) => track.stop());
      setStep(3);
    } catch (err) {
      setError("Failed to access microphone or camera. Please allow permissions.");
    }
  };

  const handleContinue = () => {
    router.push("/interview");
  };

  const renderStep = () => {
    if (error) {
      return (
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-bold">Configuration Failed</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <Mic className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Microphone & Camera Setup</h2>
            <p className="text-muted-foreground">{audioDevice ? `Detected device: ${audioDevice.label}` : "Click continue to allow access."}</p>
            <p className="text-sm text-muted-foreground">Use headphones for better audio, and sit in a well-lit room for clear video.</p>
            <Button onClick={handleDeviceAccess}>Continue</Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-2xl font-bold">All Set!</h2>
            <p className="text-muted-foreground">Audio and video devices are configured successfully.</p>
            <Button onClick={handleContinue}>Start Interview</Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Interview Setup</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
