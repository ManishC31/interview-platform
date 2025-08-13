'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Bot, Phone, Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function InterviewPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id;

  // ref for video preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState(0);

  // for questions
  const [currentQuestion, setCurrentQuestion] = useState("")

  // for transcription
  const [audioStream, setAudioStream] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState("")

  // ref for transcription
  const recognizerRef: any = useRef(null);
  const transcriptionTimeoutRef = useRef(null);
  const transcriptionRef = useRef(""); // Store latest transcription

  // for mobile view - track if interviewer is speaking
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);

  // Check if device is mobile
  const [isMobile, setIsMobile] = useState(false);

  // for speech state management
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [introMessagePlayed, setIntroMessagePlayed] = useState(false);
  const [questionPlayed, setQuestionPlayed] = useState(false);

  // exit the interview
  const [showExitPrompt, setShowExitPrompt] = useState(false);


  // setup user camera in the beginning
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error('Failed to access media devices', err);
      }
    };
    getMedia();

    // Timer
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Go fullscreen when page loads
  useEffect(() => {
    const goFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      goFullscreen();
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  // get the first question to start the interview
  useEffect(() => {
    if (!introMessagePlayed) {
      speakText("Hello Manish, welcome to the interview. We are going to start the interview.")
      setIntroMessagePlayed(true);
    }
  }, [introMessagePlayed])

  // go full screen
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

  // do not allow the user to switch the tab.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setShowExitPrompt(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handleBlur = () => {
      setShowExitPrompt(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);


  const fetchFirstQuestion = async () => {
    try {

      // setup the audio stream
      // get the default device id for audio recognition (audioStream)
      // Get the default audio input device and create a stream for audio recognition
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInput = devices.find(device => device.kind === "audioinput");
      if (!audioInput) {
        throw new Error("No audio input device found");
      }
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioInput.deviceId ? { exact: audioInput.deviceId } : undefined }
      });

      setAudioStream(audioStream)

      // get the first question
      const response = await axios.post('/api/question/new', { interview_id: interviewId })

      if (response.data.success) {
        if (!response.data.data.is_interview_closed) {
          setCurrentQuestion(response?.data?.data?.question)
          // Speak the question after intro message finishes
          setTimeout(() => {
            speakText(response?.data?.data?.question)
            setQuestionPlayed(true);
          }, 4000); // Wait for intro message to finish
        }
      } else {
        handleLastMessage()
      }
    } catch (error) {
      console.log('fetchFirstQuestion err:', error)
      // TODO: handle the condition
    }
  }

  // Fetch first question after intro message starts
  useEffect(() => {
    if (introMessagePlayed && !questionPlayed) {
      fetchFirstQuestion()
    }
  }, [introMessagePlayed, questionPlayed])


  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Stop any existing speech
      window.speechSynthesis.cancel();

      setIsSpeaking(true);
      setIsInterviewerSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // language
      utterance.pitch = 1;      // voice pitch
      utterance.rate = 1;       // speed
      utterance.volume = 1;     // volume (0 to 1)

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsInterviewerSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsInterviewerSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser does not support text-to-speech!");
    }
  };


  // function to end the interview
  const handleLastMessage = async () => {
    try {
      console.log("Interview finished, calling finish API");

      // Call the finish API with the same data structure as question/new
      const response = await axios.post('/api/interview/finish', {
        interview_id: interviewId,
        question: currentQuestion,
        answer: transcriptionRef.current || ""
      });

      console.log("Finish API response:", response.data);
    } catch (error) {
      console.error("Error calling finish API:", error);
    } finally {
      // Stop all media streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track: any) => track.stop());
      }

      // Stop transcription if it's running
      if (recognizerRef.current && isTranscribing) {
        try {
          await recognizerRef.current.stopContinuousRecognitionAsync();
          recognizerRef.current.close();
        } catch (error) {
          console.error("Error stopping transcription:", error);
        }
      }

      // Redirect to main page with interview ID
      router.replace(`/?id=${interviewId}`);
    }
  }

  const confirmInterviewExit = (): void => {
    setShowExitPrompt(false);
    router.replace("/");
  };

  const cancelInterviewExit = () => {
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


  // function to exit the interview.
  const handleLeaveInterview = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setShowExitPrompt(false);
    router.replace("/");
  };


  // format time to show on top-right corner
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // start transcription
  const startTranscription = async () => {
    try {
      if (isTranscribing) return;

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(process.env.NEXT_PUBLIC_SPEECH_KEY!, process.env.NEXT_PUBLIC_SPEECH_REGION!);

      speechConfig.speechRecognitionLanguage = "en-US";

      // Configure speech settings for better recognition
      speechConfig.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "1000");
      speechConfig.setProperty("speechcontext-phraseDetection.enable", "true");

      // Get the audio stream for transcription
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInput = devices.find(device => device.kind === "audioinput");
      if (!audioInput) {
        throw new Error("No audio input device found");
      }
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioInput.deviceId ? { exact: audioInput.deviceId } : undefined }
      });

      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(audioStream);
      recognizerRef.current = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      // Clear previous transcription and set up a finalized text store
      setTranscription("");
      transcriptionRef.current = ""; // Reset latest transcription
      let finalizedText = "";

      // Handle intermediate results
      recognizerRef.current.recognizing = (s: any, e: any) => {
        if (e.result.text) {
          const newText = e.result.text.trim();
          setTranscription((prev) => {
            const nonFinalizedText = prev.replace(finalizedText, "").trim();
            if (!nonFinalizedText.endsWith(newText)) {
              let updatedText = `${finalizedText} ${newText}`.trim();
              transcriptionRef.current = updatedText; // Store latest value
              return updatedText;
            }
            return prev;
          });
        }
      };

      // Handle final results
      recognizerRef.current.recognized = (s: any, e: any) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          const newText = e.result.text.trim();
          if (!finalizedText.includes(newText)) {
            finalizedText += ` ${newText}`;
            setTranscription(finalizedText.trim());
            transcriptionRef.current = finalizedText; // Update latest transcription
          }
        }
      };

      recognizerRef.current.sessionStopped = async (s: any, e: any) => {
        // recognizerRef.current.stopContinuousRecognitionAsync();
        await stopTranscription();
      };

      recognizerRef.current.canceled = async (s: any, e: any) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`Error details: ${e.errorDetails}`);
        }

        await stopTranscription();
      };

      await recognizerRef.current.startContinuousRecognitionAsync();
      setIsTranscribing(true);
    } catch (error: any) {
      console.error(`Transcription error: ${error.message}`);
      console.error("The interview portal is busy. Please try again later.");
    }
  };

  // stop transcription
  const stopTranscription = async () => {
    try {
      console.log("Ensuring all transcription is finalized:", transcriptionRef.current);

      if (recognizerRef.current && isTranscribing) {
        // Clear any pending timeouts
        if (transcriptionTimeoutRef.current) {
          clearTimeout(transcriptionTimeoutRef.current);
        }

        // Create a promise to ensure proper stopping
        await new Promise<void>((resolve, reject) => {
          try {
            recognizerRef.current.stopContinuousRecognitionAsync(
              async () => {
                // Cleanup after successful stop
                if (recognizerRef.current) {
                  recognizerRef.current.close();
                  recognizerRef.current = null;
                }
                setIsTranscribing(false);

                // Wait a bit for any final transcription to be processed
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Get the final transcription
                const finalTranscription = transcriptionRef.current;

                // Call API with the complete transcription
                if (finalTranscription && finalTranscription.trim()) {
                  try {
                    const response = await axios.post('/api/question/new', {
                      interview_id: interviewId,
                      question: currentQuestion,
                      answer: finalTranscription
                    });

                    if (response.data.success) {
                      if (!response.data.data.is_interview_closed) {
                        setCurrentQuestion(response.data.data.question);
                        // Speak the new question
                        speakText(response.data.data.question);
                      } else {
                        handleLastMessage();
                      }
                    } else {
                      handleLastMessage();
                    }
                  } catch (error) {
                    console.error('Error calling question API:', error);
                    // Handle error appropriately
                  }
                }

                resolve();
              },
              (err: any) => {
                console.error("Error stopping recognition:", err);
                reject(err);
              }
            );
          } catch (error) {
            reject(error);
          }
        });
      }
    } catch (error) {
      console.error("Error in stopTranscription:", error);
    } finally {
      setIsTranscribing(false);
      recognizerRef.current = null;
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">AssessHub</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg font-mono">{formatTime(timer)}</span>
            <Button variant="destructive" size="sm" onClick={handleLeaveInterview} className="gap-2">
              <Phone className="w-4 h-4" />
              Leave Interview
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-2 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

          {/* User Video Card */}
          <Card className={`${isMobile && isInterviewerSpeaking ? 'hidden' : 'lg:col-span-2'} overflow-hidden h-full ${!isSpeaking && !isTranscribing ? 'ring-4 ring-green-500 ring-opacity-50' : ''}`}>
            <CardContent className="p-0 h-full">
              <div className="relative h-full bg-muted overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  suppressHydrationWarning
                  className="w-full h-full object-cover"
                  style={{ margin: 0, padding: 0, display: 'block' }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">You</span>
                </div>

                {/* button to start & stop the transcription */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 items-center justify-center w-full">
                  {currentQuestion ? (<div className='bg-black/50 text-center text-base text-pretty'>{currentQuestion}</div>) : null}
                  {!isTranscribing ? (
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                      onClick={startTranscription}
                      disabled={isTranscribing || isSpeaking}
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                      onClick={stopTranscription}
                    >
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Interviewer Card */}
          <Card className={`${isMobile && !isInterviewerSpeaking ? 'hidden' : ''} overflow-hidden`}>
            <CardContent className="p-0 h-full">
              <div className="relative h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className={`relative ${isSpeaking ? 'animate-pulse' : ''}`}>
                    <Bot className="w-16 h-16 text-muted-foreground" />
                    {isSpeaking && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                        <Volume2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  {isSpeaking && (
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Interviewer is speaking...</div>
                      <div className="flex gap-1 mt-2 justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <Bot className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Interviewer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Toggle Button */}
        {isMobile && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setIsInterviewerSpeaking(!isInterviewerSpeaking)}
              className="gap-2"
            >
              {isInterviewerSpeaking ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Show Camera
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Show Interviewer
                </>
              )}
            </Button>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="mt-6 p-4 bg-card rounded-lg border">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Your Response
            </h3>
            <div className="bg-muted p-3 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
              <p className="text-sm leading-relaxed">{transcription}</p>
            </div>
          </div>
        )}

      </main>

      <AlertDialog open={showExitPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Fullscreen Detected</AlertDialogTitle>
            <AlertDialogDescription>Exiting fullscreen or switching tabs will terminate your test. Do you want to continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={cancelInterviewExit}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmInterviewExit}>
              Okay, Exit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}