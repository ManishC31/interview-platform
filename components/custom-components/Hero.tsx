"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InterviewConfigDialog from "@/components/custom-components/InterviewConfigDialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from 'axios'
import { ICandidate } from "@/models/candidate.model";
import { Button } from "../ui/button";
import { IPosition } from "@/models/position.model";
import { IInterview } from "@/models/interview.model";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import toast from "react-hot-toast";

// Beautiful Loader Component
const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
    <div className="relative">
      {/* Outer ring */}
      <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
      {/* Inner ring */}
      <div className="absolute top-2 left-2 w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      {/* Center dot */}
      <div className="absolute top-6 left-6 w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse"></div>
    </div>
    <div className="mt-6 text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Interview...</h2>
      <p className="text-gray-600 text-sm">Please wait while we prepare your interview</p>
    </div>
  </div>
);

export const Hero = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id') || "";

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interview, setInterview] = useState<IInterview | null>()
  const [candidate, setCandidate] = useState<ICandidate | null>()
  const [position, setPosition] = useState<IPosition | null>()
  const [resumeFile, setResumeFile] = useState<File | null>()

  useEffect(() => {
    getInterviewInformation()
  }, [])

  const getInterviewInformation = async () => {
    try {
      const response = await axios.get(`/api/interview?id=${interviewId}`)
      setInterview(response?.data?.data?.interview)
      setCandidate(response?.data?.data?.candidate)
      setPosition(response?.data?.data?.position)
    } catch (error) {
      console.log(error)
    } finally {
      setIsPageLoading(false)
    }
  }

  const uploadCandidateResume = async () => {
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("file", resumeFile);
      }
      if (candidate?._id) {
        formData.append("candidate_id", candidate._id.toString());
      }

      const response = await fetch("/api/candidate/resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to upload file");
        return;
      }

      const data = await response.json();
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error('Err in uploadCandidateResume:', error)
    }
  }

  // Show loader while page is loading
  if (isPageLoading) {
    return <Loader />
  }

  if (!interviewId) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen w-full bg-white rounded-lg shadow-sm px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            No Interview Assigned
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center">
            Oops! You don't have an interview assigned yet.
          </h1>
          <p className="text-gray-600 text-base sm:text-lg text-center max-w-xl">
            It looks like there is currently no interview scheduled for your account.<br />
            Please check back later or contact your recruiter for more information.
          </p>
        </div>
      </section>
    )
  } else if (interview && (interview.status === 'completed' || interview.status === 'aborted')) {
    return (
      <section className="w-full min-h-screen relative overflow-hidden bg-white">
        {/* Background Elements - Hidden on mobile for performance */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10 hidden sm:block" />
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-bl from-green-100 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex items-center justify-center px-3 sm:px-4 py-12 lg:py-16">
          <div className="max-w-4xl w-full space-y-6 sm:space-y-8 lg:space-y-12">

            {/* Hero Section */}
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Status Badge - Mobile optimized */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Interview Completed
              </div>

              {/* Main Heading - Responsive text sizes */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight px-2 text-gray-900">
                Congratulations!{" "}
                <span className="bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-transparent bg-clip-text">
                  Interview Completed
                </span>
              </h1>

              {/* Candidate Name - Mobile friendly */}
              {candidate?.firstname && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold px-2 text-gray-800">
                  Great job,{" "}
                  <span className="bg-gradient-to-r from-[#00BCD4] via-[#0097A7] to-[#006064] text-transparent bg-clip-text">
                    {candidate?.firstname}
                  </span>
                  <span className="inline-block ml-1 sm:ml-2">🎉</span>
                </h2>
              )}

              {/* Description - Mobile optimized */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
                You have successfully completed your interview. Thank you for your time and participation!
              </p>
            </div>

          </div>
        </div>
      </section>
    );
  } else {
    return (
      <section className="w-full min-h-screen relative overflow-hidden bg-white">
        {/* Background Elements - Hidden on mobile for performance */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10 hidden sm:block" />
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-bl from-pink-100 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex items-center justify-center px-3 sm:px-4 py-12 lg:py-16">
          <div className="max-w-4xl w-full space-y-6 sm:space-y-8 lg:space-y-12">

            {/* Hero Section */}
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Status Badge - Mobile optimized */}
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Interview Invitation Received
              </div>

              {/* Main Heading - Responsive text sizes */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight px-2 text-gray-900">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#FF6B9D] via-[#E91E63] to-[#9C27B0] text-transparent bg-clip-text">
                  AssessHub
                </span>
              </h1>

              {/* Candidate Name - Mobile friendly */}
              {candidate?.firstname && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold px-2 text-gray-800">
                  Hello,{" "}
                  <span className="bg-gradient-to-r from-[#00BCD4] via-[#0097A7] to-[#006064] text-transparent bg-clip-text">
                    {candidate?.firstname}
                  </span>
                  <span className="inline-block ml-1 sm:ml-2">👋</span>
                </h2>
              )}

              {/* Description - Mobile optimized */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
                You've been invited to participate in a formal interview. Please upload your resume to begin the interview process.
              </p>
            </div>

            {/* Main Content - Stack on mobile, grid on larger screens */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-0">

              {/* Resume Upload Card */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-gray-200">
                <CardContent className="p-4 sm:p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Section: Icon & Text */}
                    <div className="text-center lg:text-start space-y-4 sm:space-y-6 flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {candidate?.resume_text ? (
                            <>
                              {/* Green tick icon for resume found */}
                              <svg className="w-6 h-6 text-green-500 font-bold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5" />
                              </svg>
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Resume Found.</h3>
                            </>
                          ) : (
                            <>
                              {/* Upload icon for resume not found */}
                              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
                                <rect x="4" y="16" width="16" height="4" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Resume Upload</h3>
                            </>
                          )}
                        </div>
                        <p className="text-sm sm:text-sm px-2 lg:px-0 text-gray-600">
                          {candidate?.resume_text
                            ? "We found your existing resume. You can view it or upload a new one."
                            : "Please upload your resume to proceed with the interview."}
                        </p>
                      </div>
                    </div>

                    {/* Right Section: Buttons */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 lg:gap-4 w-full lg:w-64 mt-6 sm:mt-0">
                      {candidate?.resume_text ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 border-gray-300 text-gray-700"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Existing Resume
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium hover:bg-green-50 hover:border-green-300 transition-all duration-200 border-gray-300 text-gray-700"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            Upload Another Resume
                          </Button>
                        </>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 border-gray-300 text-gray-700"
                            >
                              <svg
                                className="w-5 h-5 mr-2 sm:mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              Upload Resume
                            </Button></DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <Label htmlFor="jdfile">Job Description</Label>
                            <Input
                              id="jdfile"
                              type="file"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  setResumeFile(e.target?.files[0]);
                                }
                              }}
                            />
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                              </DialogClose>
                              <Button onClick={() => {
                                uploadCandidateResume()
                              }}>Upload</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Start Interview Button */}
            <div className="text-center space-y-3 sm:space-y-4">
              <Button
                size="lg"
                onClick={() => setDialogOpen(true)}
                className="w-3/4 sm:w-auto px-8 sm:px-12 lg:px-16 py-6 text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transform hover:scale-102 transition-all duration-300 shadow-lg hover:shadow-xl text-white"
              >
                Start Interview
              </Button>
              <p className="text-xs sm:text-sm text-gray-500 px-4">
                Make sure you have uploaded your resume before starting
              </p>
            </div>
          </div>
        </div>

        <InterviewConfigDialog open={dialogOpen} onClose={() => setDialogOpen(false)} interviewId={interviewId} />
      </section>
    )
  }

}