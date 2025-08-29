'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Bot, Phone, Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'next/navigation';
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
  const params = useParams()
  const interviewId = params.id;

  // ref for video preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState(0);

  // for questions
  const [currentQuestion, setCurrentQuestion] = useState("")

  // for transcription
  // const [audioStream, setAudioStream] = useState<any>(null)
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

  // Speech queue management
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);


  // setup user camera in the beginning
  useEffect(() => {
    // Initialize camera access and device detection for responsive behavior

    // Check if device is mobile based on screen width (lg breakpoint)
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const getMedia = async () => {
      try {
        // Request camera and microphone access for video interview
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        // Handle case where user denies camera/microphone access
      }
    };
    getMedia();

    // Start interview timer to track duration
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => {
      // Cleanup: stop all media tracks and remove event listeners
      stream?.getTracks().forEach((track) => track.stop());
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Go fullscreen when page loads for immersive interview experience
  useEffect(() => {
    const goFullscreen = () => {
      const elem = document.documentElement;
      // Cross-browser fullscreen API support
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    };

    // Small delay to ensure page is fully loaded before requesting fullscreen
    const timer = setTimeout(() => {
      goFullscreen();
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  // get the first question to start the interview
  useEffect(() => {
    if (!introMessagePlayed) {
      // Mark intro as played to trigger first question fetch
      setIntroMessagePlayed(true);
    }
  }, [introMessagePlayed])

  // Monitor fullscreen state and show exit prompt if user exits fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Show confirmation modal before allowing exit to prevent accidental interview termination
        setShowExitPrompt(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Prevent tab switching and window blur to maintain interview integrity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Detect when user switches tabs and show exit prompt
        setShowExitPrompt(true);
      }
    };

    const handleBlur = () => {
      // Detect when window loses focus and show exit prompt
      setShowExitPrompt(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);


  const fetchFirstQuestion = async () => {
    // Fetch the first interview question from the API
    try {
      // get the first question
      const response = await axios.post('/api/question/new', { interview_id: interviewId })

      if (response.data.success) {
        if (!response.data.data.is_interview_closed) {
          // Set the question and add it to speech queue for text-to-speech
          setCurrentQuestion(response?.data?.data?.question)
          speakText(response?.data?.data?.question)
          setQuestionPlayed(true);
        }

        if (response.data.data.is_interview_closed && !response.data.data.question) {
          // Interview is complete - play closing message and finish
          speakText("It's been great speaking with you today. We appreciate the time and thought you've put into your answers, and we'll be in touch once we've completed our review process.")
          handleInterviewFinish()
        }
      } else {
        // API returned failure - finish interview
        handleInterviewFinish()
      }
    } catch (error) {
      // Handle API errors by finishing interview
    }
  }

  // Fetch first question after intro message starts
  useEffect(() => {
    if (introMessagePlayed && !questionPlayed) {
      // Conditions met - fetch the first interview question
      fetchFirstQuestion()
    }
  }, [introMessagePlayed, questionPlayed])


  const speakText = (text: string) => {
    // Add text to speech queue for sequential text-to-speech processing

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Add text to queue for processing
      speechQueueRef.current.push(text);

      // Start processing queue if not already processing
      if (!isProcessingQueueRef.current) {
        processSpeechQueue();
      }
    } else {
      // Fallback for browsers without text-to-speech support
      alert("Sorry, your browser does not support text-to-speech!");
    }
  };

  const processSpeechQueue = () => {
    // Process speech queue sequentially to avoid overlapping speech

    if (speechQueueRef.current.length === 0) {
      // Queue empty - stop processing and update speaking states
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      setIsInterviewerSpeaking(false);
      return;
    }

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);
    setIsInterviewerSpeaking(true);

    // Stop any existing speech before starting new one
    window.speechSynthesis.cancel();

    const text = speechQueueRef.current.shift()!;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      // Process next item in queue when current speech ends
      processSpeechQueue();
    };

    utterance.onerror = () => {
      // Process next item in queue even on error to prevent queue blocking
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  };

  const clearSpeechQueue = () => {
    // Clear speech queue and stop any ongoing speech synthesis
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
    setIsSpeaking(false);
    setIsInterviewerSpeaking(false);
  };


  // function to end the interview
  const handleInterviewFinish = async () => {
    // Complete interview process: cleanup resources and redirect to results
    try {
      // Clear speech queue before finishing to prevent ongoing speech
      clearSpeechQueue();

      // Call the finish API to mark interview as complete
      const response = await axios.get(`/api/interview/finish/${interviewId}`);
    } catch (error) {
      // Handle API errors gracefully
    } finally {
      // Stop all media streams and release camera/mic access
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Explicitly release camera and microphone access for all devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        for (const device of devices) {
          if (device.kind === "videoinput" || device.kind === "audioinput") {
            try {
              const tempStream = await navigator.mediaDevices.getUserMedia({
                video: device.kind === "videoinput",
                audio: device.kind === "audioinput",
              });
              tempStream.getTracks().forEach((track) => track.stop());
            } catch (err) {
              // Ignore errors if device is already released or unavailable
            }
          }
        }
      } catch (err) {
        // Ignore errors in device enumeration
      }

      // Stop transcription if it's running
      if (recognizerRef.current && isTranscribing) {
        try {
          await recognizerRef.current.stopContinuousRecognitionAsync();
          recognizerRef.current.close();
        } catch (error) {
          // Handle transcription cleanup errors
        }
      }

      // Wait a moment to ensure camera/mic are released before redirecting
      setTimeout(() => {
        // Redirect to results page with interview ID
        window.location.href = `/?id=${interviewId}`;

        // Exit fullscreen mode
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen?.();
        } else if ((document as any).msFullscreenElement) {
          (document as any).msExitFullscreen?.();
        }
      }, 300);
    }
  }

  const confirmInterviewExit = (): void => {
    // User confirmed exit - proceed with interview termination
    setShowExitPrompt(false);
    handleInterviewFinish()
  };

  const cancelInterviewExit = () => {
    // User cancelled exit - return to fullscreen mode
    setShowExitPrompt(false);
    goFullscreen();
  };

  const goFullscreen = () => {
    // Manually enter fullscreen mode with cross-browser support
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
    // User requested to leave interview - show confirmation dialog
    setShowExitPrompt(true)
  };


  // format time to show on top-right corner
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // start transcription
  const startTranscription = async () => {
    // Initialize speech recognition for real-time transcription
    try {
      if (isTranscribing) {
        // Prevent multiple transcription sessions
        return;
      }

      // Configure Azure Speech Services for speech recognition
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(process.env.NEXT_PUBLIC_SPEECH_KEY!, process.env.NEXT_PUBLIC_SPEECH_REGION!);

      speechConfig.speechRecognitionLanguage = "en-US";

      // Configure speech settings for better recognition accuracy
      speechConfig.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "1000");
      speechConfig.setProperty("speechcontext-phraseDetection.enable", "true");

      // Get the audio stream for transcription from user's microphone
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

      // Handle intermediate results for real-time feedback
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

      // Handle final results when speech segment is complete
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
        // Handle session stop - cleanup and process final transcription
        await stopTranscription();
      };

      recognizerRef.current.canceled = async (s: any, e: any) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          // Log recognition errors for debugging
        }

        // Handle cancellation - cleanup and process final transcription
        await stopTranscription();
      };

      // Start continuous recognition for ongoing transcription
      await recognizerRef.current.startContinuousRecognitionAsync();
      setIsTranscribing(true);
    } catch (error: any) {
      // Handle transcription initialization errors
    }
  };

  // stop transcription
  const stopTranscription = async () => {
    // Stop speech recognition and process final transcription
    try {
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

                // Call API with the complete transcription to get next question
                if (finalTranscription && finalTranscription.trim()) {
                  try {
                    const response = await axios.post('/api/question/new', {
                      interview_id: interviewId,
                      question: currentQuestion,
                      answer: finalTranscription
                    });

                    if (response.data.success) {
                      if (!response.data.data.is_interview_closed) {
                        // Set new question and add to speech queue
                        setCurrentQuestion(response?.data?.data?.question);
                        speakText(response?.data?.data?.question);
                      } else {
                        // Interview closed - finish process
                        handleInterviewFinish();
                      }
                    } else {
                      // API failure - finish interview
                      handleInterviewFinish();
                    }
                  } catch (error) {
                    // Handle API errors appropriately
                  }
                }

                resolve();
              },
              (err: any) => {
                reject(err);
              }
            );
          } catch (error) {
            reject(error);
          }
        });
      }
    } catch (error) {
      // Handle transcription stopping errors
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
          <h1 className="text-2xl font-bold text-foreground">AssessHub</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg font-mono text-foreground">{formatTime(timer)}</span>
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
          <Card className={`${isMobile && isInterviewerSpeaking ? 'hidden' : 'lg:col-span-2'} overflow-hidden h-full ${!isSpeaking && !isTranscribing ? 'ring-4 ring-green-500 ring-opacity-50 shadow-2xl' : ''}`}>
            <CardContent className="p-0 h-full">
              <div className="relative h-full bg-mute`d overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  suppressHydrationWarning
                  className="w-full h-full object-cover"
                  style={{ margin: 0, padding: 0, display: 'block' }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border">
                  <User className="w-4 h-4 text-foreground" />
                  <span className="text-foreground text-sm font-medium">You</span>
                </div>

                {/* button to start & stop the transcription */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 items-center justify-center w-full">
                  {!isTranscribing ? (
                    <Button
                      className="px-8 py-4 text-lg font-semibold shadow-lg bg-green-600 hover:bg-green-700 text-white"
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
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border">
                  <Bot className="w-4 h-4 text-foreground" />
                  <span className="text-foreground text-sm font-medium">Interviewer</span>
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

        {currentQuestion ? (<div className='my-3 bg-background/80 text-center text-base text-pretty p-2 rounded-lg border-t border-l border-r border-b'>{currentQuestion}</div>) : null}
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