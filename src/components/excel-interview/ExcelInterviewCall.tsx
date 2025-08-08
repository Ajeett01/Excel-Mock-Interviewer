"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRightSquareIcon, CheckCircleIcon, AlarmClockIcon, Play, SkipForward, XCircleIcon, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import { Interview } from "@/types/interview";
import { ExcelInterviewState, ExcelQuestion, PracticalTask, UserAction, SpreadsheetResult } from "@/types/excel";
import { isLightColor, testEmail } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import SpreadsheetWorkspace from "@/components/spreadsheet/SpreadsheetWorkspace";
import { RetellWebClient } from "retell-client-js-sdk";
import axios from "axios";
import { useResponses } from "@/contexts/responses.context";
import { ResponseService } from "@/services/responses.service";
import { InterviewerService } from "@/services/interviewers.service";
import MiniLoader from "@/components/loaders/mini-loader/miniLoader";
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

interface ExcelInterviewCallProps {
  interview: Interview;
}

const webClient = new RetellWebClient();

type registerCallResponseType = {
  data: {
    registerCallResponse: {
      call_id: string;
      access_token: string;
    };
  };
};

type transcriptType = {
  role: string;
  content: string;
};

function ExcelInterviewCall({ interview }: ExcelInterviewCallProps) {
  const { createResponse } = useResponses();
  const [currentState, setCurrentState] = useState<ExcelInterviewState>('introduction');
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  // Voice interview states
  const [isVoiceStarted, setIsVoiceStarted] = useState(false);
  const [isVoiceEnded, setIsVoiceEnded] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callId, setCallId] = useState<string>("");
  const [lastInterviewerResponse, setLastInterviewerResponse] = useState<string>("");
  const [lastUserResponse, setLastUserResponse] = useState<string>("");
  const [activeTurn, setActiveTurn] = useState<string>("");
  const [interviewerImg, setInterviewerImg] = useState("");
  const [isOldUser, setIsOldUser] = useState<boolean>(false);
  
  // Timer and duration management (like traditional interview)
  const [interviewTimeDuration, setInterviewTimeDuration] = useState<string>("1");
  const [time, setTime] = useState(0);
  const [currentTimeDuration, setCurrentTimeDuration] = useState<string>("0");
  
  // Interview progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [conceptualAnswers, setConceptualAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [taskResults, setTaskResults] = useState<SpreadsheetResult[]>([]);
  
  const lastUserResponseRef = useRef<HTMLDivElement | null>(null);
  
  // Mock data - in real implementation, this would come from the interview object
  const [questions] = useState<ExcelQuestion[]>([
    {
      id: "q1",
      question: "What is the difference between VLOOKUP and INDEX-MATCH functions in Excel?",
      type: "conceptual",
      skill_level: "intermediate",
      category: "Lookup Functions",
      difficulty_rating: 3,
      follow_up_count: 1
    },
    {
      id: "q2", 
      question: "How would you create a dynamic chart that updates automatically when new data is added?",
      type: "conceptual",
      skill_level: "intermediate", 
      category: "Charts and Visualization",
      difficulty_rating: 4,
      follow_up_count: 1
    }
  ]);

  const [tasks] = useState<PracticalTask[]>([
    {
      id: "t1",
      name: "Sales Analysis Task",
      description: "Create a sales summary report with pivot tables and charts",
      scenario: "You are given sales data for Q1-Q4. Create a comprehensive analysis.",
      skill_level: "intermediate",
      initial_data: {
        sheets: [
          {
            name: "Sales Data",
            data: [
              [{ v: "Month" }, { v: "Product" }, { v: "Sales" }, { v: "Region" }],
              [{ v: "Jan" }, { v: "Product A" }, { v: 1000 }, { v: "North" }],
              [{ v: "Jan" }, { v: "Product B" }, { v: 1500 }, { v: "South" }],
              [{ v: "Feb" }, { v: "Product A" }, { v: 1200 }, { v: "North" }],
              [{ v: "Feb" }, { v: "Product B" }, { v: 1800 }, { v: "South" }],
              [{ v: "Mar" }, { v: "Product A" }, { v: 1100 }, { v: "North" }],
              [{ v: "Mar" }, { v: "Product B" }, { v: 1600 }, { v: "South" }]
            ],
            config: {}
          }
        ],
        metadata: { created_at: new Date(), version: "1.0" }
      },
      expected_outcome: {
        sheets: [
          {
            name: "Sales Summary",
            data: [
              [{ v: "Product" }, { v: "Total Sales" }, { v: "Average Sales" }],
              [{ v: "Product A" }, { f: "=SUM(C2:C4)" }, { f: "=AVERAGE(C2:C4)" }],
              [{ v: "Product B" }, { f: "=SUM(C3:C5)" }, { f: "=AVERAGE(C3:C5)" }]
            ],
            config: {}
          }
        ],
        metadata: { created_at: new Date(), version: "1.0" }
      },
      evaluation_criteria: {
        formula_accuracy_weight: 40,
        efficiency_weight: 30,
        presentation_weight: 20,
        best_practices_weight: 10,
        required_formulas: ["SUM", "AVERAGE", "VLOOKUP"],
        optional_formulas: ["INDEX", "MATCH"]
      },
      time_limit: 15,
      difficulty_rating: 3,
      business_context: "Sales Analysis",
      required_functions: ["SUM", "AVERAGE", "VLOOKUP"]
    }
  ]);

  useEffect(() => {
    if (testEmail(email)) {
      setIsValidEmail(true);
    }
  }, [email]);

  // Voice interview effects
  useEffect(() => {
    if (lastUserResponseRef.current) {
      const { current } = lastUserResponseRef;
      current.scrollTop = current.scrollHeight;
    }
  }, [lastUserResponse]);

  // Timer effect (exactly like traditional interview)
  useEffect(() => {
    let intervalId: any;
    if (isCalling) {
      // setting time from 0 to 1 every 10 millisecond using javascript setInterval method
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    setCurrentTimeDuration(String(Math.floor(time / 100)));
    if (Number(currentTimeDuration) == Number(interviewTimeDuration) * 60) {
      console.log("Voice interview duration reached, ending call");
      webClient.stopCall();
      setIsVoiceEnded(true);
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, time, currentTimeDuration]);

  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Excel interview voice call started");
      setIsCalling(true);
      setLoading(false); // Stop loading when call actually starts
    });

    webClient.on("call_ended", () => {
      console.log("Excel interview voice call ended");
      setIsCalling(false);
      setIsVoiceEnded(true);
      // Transition to practical tasks after voice interview ends
      setTimeout(() => {
        setCurrentState('practical_tasks');
      }, 2000);
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
    });

    webClient.on("agent_stop_talking", () => {
      setActiveTurn("user");
    });

    webClient.on("error", (error) => {
      console.error("Voice interview error:", error);
      webClient.stopCall();
      setIsVoiceEnded(true);
      toast.error("Voice interview encountered an error. Moving to practical tasks.");
      setTimeout(() => {
        setCurrentState('practical_tasks');
      }, 2000);
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const transcripts: transcriptType[] = update.transcript;
        const roleContents: { [key: string]: string } = {};

        transcripts.forEach((transcript) => {
          roleContents[transcript?.role] = transcript?.content;
        });

        setLastInterviewerResponse(roleContents["agent"]);
        setLastUserResponse(roleContents["user"]);
      }
    });

    return () => {
      webClient.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const fetchInterviewer = async () => {
      try {
        const interviewer = await InterviewerService.getInterviewer(
          interview.interviewer_id,
        );
        setInterviewerImg(interviewer.image);
      } catch (error) {
        console.error("Error fetching interviewer:", error);
      }
    };
    if (interview.interviewer_id) {
      fetchInterviewer();
    }
  }, [interview.interviewer_id]);

  // Set interview duration (like traditional interview)
  useEffect(() => {
    if (interview?.time_duration) {
      setInterviewTimeDuration(interview?.time_duration);
    }
  }, [interview]);

  useEffect(() => {
    if (isVoiceEnded && callId) {
      const updateInterview = async () => {
        await ResponseService.saveResponse(
          { is_ended: true },
          callId,
        );
      };
      updateInterview();
    }
  }, [isVoiceEnded, callId]);

  const getStateProgress = () => {
    switch (currentState) {
      case 'introduction': return 0;
      case 'conceptual_questions':
        if (isVoiceEnded) return 40;
        // During voice interview, show progress based on time elapsed
        if (isCalling && Number(interviewTimeDuration) > 0) {
          const timeProgress = (Number(currentTimeDuration) / (Number(interviewTimeDuration) * 60)) * 40;
          return Math.min(timeProgress, 40);
        }
        return 20;
      case 'practical_tasks': return 50 + (currentTaskIndex / tasks.length) * 30;
      case 'feedback_generation': return 80;
      case 'conclusion': return 100;
      default: return 0;
    }
  };

  const startExcelInterview = async () => {
    console.log("Starting Excel interview...");
    const data = {
      mins: interview?.time_duration,
      objective: "Excel skills assessment interview focusing on practical Excel knowledge and problem-solving abilities",
      questions: interview?.questions?.map((q) => q.question).join(", ") || "Excel functions, formulas, data analysis, pivot tables, charts, and practical spreadsheet tasks",
      name: name || "not provided",
    };
    setLoading(true);

    try {
      // Check if user is eligible
      const oldUserEmails: string[] = (
        await ResponseService.getAllEmails(interview.id)
      ).map((item) => item.email);
      
      console.log("Checking user eligibility:", {
        email,
        oldUserEmails,
        respondents: interview?.respondents,
        isAnonymous: interview?.is_anonymous
      });
      
      // Fix eligibility logic - user is OLD/INELIGIBLE if:
      // 1. They have already responded (email in oldUserEmails) OR
      // 2. Interview has respondents list AND user email is NOT in that list
      const OldUser = oldUserEmails.includes(email) ||
        (interview?.respondents && interview?.respondents.length > 0 && !interview?.respondents.includes(email));

      console.log("User eligibility result:", { OldUser });

      if (OldUser) {
        console.log("User is not eligible - showing old user message");
        setIsOldUser(true);
        setLoading(false);
        return;
      }

      console.log("User is eligible - proceeding with interview");

      console.log("Registering call...");
      // Start voice interview
      const registerCallResponse: registerCallResponseType = await axios.post(
        "/api/register-call",
        { dynamic_data: data, interviewer_id: interview?.interviewer_id },
      );

      console.log("Call registered:", registerCallResponse.data);

      if (registerCallResponse.data.registerCallResponse.access_token) {
        console.log("Starting web client call...");
        
        // First transition to conceptual_questions state
        setCurrentState('conceptual_questions');
        setIsVoiceStarted(true);
        setCallId(registerCallResponse?.data?.registerCallResponse?.call_id);

        // Then start the actual voice call
        await webClient
          .startCall({
            accessToken:
              registerCallResponse.data.registerCallResponse.access_token,
          })
          .catch((error) => {
            console.error("WebClient startCall error:", error);
            throw error;
          });

        console.log("Voice call started successfully");

        // Create response record
        await createResponse({
          interview_id: interview.id,
          call_id: registerCallResponse.data.registerCallResponse.call_id,
          email: email,
          name: name,
        });

        toast.success("Excel interview started! Voice interview in progress...");
      } else {
        throw new Error("Failed to register call - no access token");
      }
    } catch (error) {
      console.error("Error starting Excel interview:", error);
      toast.error("Failed to start voice interview. Moving to practical tasks.");
      // If voice interview fails, go directly to practical tasks
      setCurrentState('practical_tasks');
      setIsVoiceEnded(true);
    } finally {
      setLoading(false);
    }
  };

  const endVoiceInterview = async () => {
    if (isVoiceStarted && isCalling) {
      setLoading(true);
      webClient.stopCall();
      setIsVoiceEnded(true);
      setLoading(false);
      toast.success("Voice interview completed! Moving to practical tasks...");
      setTimeout(() => {
        setCurrentState('practical_tasks');
      }, 2000);
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) {
      toast.error("Please provide an answer before continuing");
      return;
    }

    const newAnswers = [...conceptualAnswers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setConceptualAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to practical tasks
      setCurrentState('practical_tasks');
      setCurrentTaskIndex(0);
    }
  };

  const handleActionPerformed = (action: UserAction) => {
    setUserActions(prev => [...prev, action]);
  };

  const handleTaskComplete = (result: SpreadsheetResult) => {
    setTaskResults(prev => [...prev, result]);
    
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // Move to feedback generation
      setCurrentState('feedback_generation');
      // Simulate feedback generation
      setTimeout(() => {
        setCurrentState('conclusion');
      }, 3000);
    }
  };

  const handleManualTaskComplete = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // Move to feedback generation
      setCurrentState('feedback_generation');
      // Simulate feedback generation
      setTimeout(() => {
        setCurrentState('conclusion');
      }, 3000);
    }
  };

  const renderStateContent = () => {
    switch (currentState) {
      case 'introduction':
        return (
          <div className="w-fit min-w-[400px] max-w-[600px] mx-auto mt-2 border border-indigo-200 rounded-md p-4 m-2 bg-slate-50">
            <div>
              {interview?.logo_url && (
                <div className="p-1 flex justify-center">
                  <Image
                    src={interview?.logo_url}
                    alt="Logo"
                    className="h-10 w-auto"
                    width={100}
                    height={100}
                  />
                </div>
              )}
              <div className="p-2 font-normal text-sm mb-4 whitespace-pre-line">
                <h3 className="font-bold text-lg mb-2">Excel Mock Interview</h3>
                <p className="mb-2">{interview?.description}</p>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="font-bold text-sm text-blue-800">
                    This comprehensive Excel interview includes:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                    <li>🎤 AI voice interview about your Excel experience and knowledge</li>
                    <li>📊 {tasks.length} hands-on spreadsheet tasks with real data</li>
                    <li>💼 Real-world business scenarios and problem-solving</li>
                    <li>🤖 AI-powered evaluation and comprehensive feedback</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="font-bold text-sm text-amber-800 mb-1">
                    🎯 Interview Flow:
                  </p>
                  <ol className="text-xs text-amber-700 list-decimal list-inside space-y-1">
                    <li>Voice conversation with AI interviewer about Excel skills</li>
                    <li>Hands-on Excel tasks using our professional spreadsheet interface</li>
                    <li>AI analysis and personalized feedback on your performance</li>
                  </ol>
                </div>
                <p className="font-bold text-sm">
                  🔊 Ensure your volume is up and grant microphone access when prompted.
                  {"\n"}🤫 Please make sure you are in a quiet environment.
                  {"\n\n"}Note: Tab switching will be monitored during the interview.
                </p>
              </div>
              {!interview?.is_anonymous && (
                <div className="flex flex-col gap-2 justify-center">
                  <div className="flex justify-center">
                    <input
                      value={email}
                      className="h-fit mx-auto py-2 border-2 rounded-md w-[75%] self-center px-2 border-gray-400 text-sm font-normal"
                      placeholder="Enter your email address"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      value={name}
                      className="h-fit mb-4 mx-auto py-2 border-2 rounded-md w-[75%] self-center px-2 border-gray-400 text-sm font-normal"
                      placeholder="Enter your first name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="w-[80%] flex flex-row mx-auto justify-center items-center align-middle">
              <Button
                className="min-w-20 h-10 rounded-lg flex flex-row justify-center mb-8"
                style={{
                  backgroundColor: interview.theme_color ?? "#4F46E5",
                  color: isLightColor(interview.theme_color ?? "#4F46E5")
                    ? "black"
                    : "white",
                }}
                disabled={
                  loading ||
                  (!interview?.is_anonymous && (!isValidEmail || !name))
                }
                onClick={startExcelInterview}
              >
                {loading ? "Starting..." : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Excel Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'conceptual_questions':
        if (isOldUser) {
          return (
            <div className="w-fit min-w-[400px] max-w-[500px] mx-auto mt-2 border border-indigo-200 rounded-md p-4 m-2 bg-slate-50">
              <div className="p-2 font-normal text-base mb-4 whitespace-pre-line">
                <CheckCircleIcon className="h-[2rem] w-[2rem] mx-auto my-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500" />
                <p className="text-lg font-semibold text-center">
                  You have already responded in this interview or you are not eligible to respond. Thank you!
                </p>
                <p className="text-center">
                  {"\n"}You can close this tab now.
                </p>
              </div>
            </div>
          );
        }

        if (isVoiceEnded) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="text-center mb-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Voice Interview Completed!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Great job! Now let's move to the practical Excel tasks...
                </p>
                <div className="animate-pulse">
                  <p className="text-sm text-gray-500">Preparing spreadsheet workspace...</p>
                </div>
              </div>
            </div>
          );
        }

        if (!isVoiceStarted || loading) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="text-center mb-8">
                <Mic className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Starting Voice Interview</h2>
                <p className="text-lg text-gray-600 mb-6">
                  {loading ? "Connecting to AI interviewer..." : "Initializing AI interviewer for Excel skills assessment..."}
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                {loading && (
                  <p className="text-sm text-gray-500 mt-4">
                    Please wait while we set up your voice interview...
                  </p>
                )}
              </div>
            </div>
          );
        }

        // Voice interview in progress
        return (
          <div className="h-full flex flex-col">
            {/* Voice Interview Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">AI Voice Interview - Excel Skills</h2>
                <p className="text-sm text-gray-600">Discuss your Excel experience and knowledge with our AI interviewer</p>
                <div className="flex items-center justify-center mt-2 space-x-4">
                  <div className="flex items-center">
                    {isCalling ? (
                      <div className="flex items-center text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-sm font-medium">Interview in progress</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-sm">Connecting...</span>
                      </div>
                    )}
                  </div>
                  {isCalling && (
                    <div className="flex items-center text-blue-600">
                      <AlarmClockIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {Math.floor(Number(currentTimeDuration) / 60)}:{String(Number(currentTimeDuration) % 60).padStart(2, '0')} / {interviewTimeDuration}:00
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Interview Interface */}
            <div className="flex-1 flex flex-row p-4">
              {/* Interviewer Side */}
              <div className="w-1/2 border-r border-gray-200 pr-4">
                <div className="flex flex-col h-full">
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                    <div className="text-lg leading-relaxed">
                      {lastInterviewerResponse || "AI Interviewer is preparing questions about your Excel skills..."}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Image
                        src={interviewerImg || "/default-interviewer.png"}
                        alt="AI Interviewer"
                        width={100}
                        height={100}
                        className={`object-cover rounded-full ${
                          activeTurn === "agent"
                            ? "ring-4 ring-blue-500 ring-opacity-75"
                            : ""
                        }`}
                      />
                      {activeTurn === "agent" && (
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                          <Mic className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="font-semibold mt-2 text-gray-700">AI Interviewer</div>
                  </div>
                </div>
              </div>

              {/* User Side */}
              <div className="w-1/2 pl-4">
                <div className="flex flex-col h-full">
                  <div
                    ref={lastUserResponseRef}
                    className="flex-1 bg-blue-50 rounded-lg p-4 mb-4 overflow-y-auto"
                  >
                    <div className="text-lg leading-relaxed">
                      {lastUserResponse || "Your responses will appear here as you speak..."}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Image
                        src="/user-icon.png"
                        alt="You"
                        width={100}
                        height={100}
                        className={`object-cover rounded-full ${
                          activeTurn === "user"
                            ? "ring-4 ring-green-500 ring-opacity-75"
                            : ""
                        }`}
                      />
                      {activeTurn === "user" && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <Mic className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="font-semibold mt-2 text-gray-700">You</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Interview Controls */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  💡 Speak clearly about your Excel experience, functions you know, and problem-solving approaches
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Expected duration: <span className="font-semibold text-blue-600">{interviewTimeDuration} mins</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="outline" size="sm" disabled={loading}>
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        End Voice Interview
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Voice Interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end the voice interview and move you to the practical Excel tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Continue Interview</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-indigo-600 hover:bg-indigo-800"
                          onClick={endVoiceInterview}
                        >
                          End & Continue to Tasks
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        );

      case 'practical_tasks':
        const currentTask = tasks[currentTaskIndex];
        return (
          <div className="h-full flex flex-col">
            {/* Task Header - Compact */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentTask.name}</h2>
                  <p className="text-sm text-gray-600">Task {currentTaskIndex + 1} of {tasks.length}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Time Limit</div>
                  <div className="text-lg font-semibold text-blue-600">{currentTask.time_limit} min</div>
                </div>
              </div>
              
              {/* Scenario - Always Visible */}
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">Task Instructions:</h4>
                    <p className="text-blue-800 text-sm mt-1">{currentTask.description}</p>
                    <p className="text-blue-700 text-xs mt-2"><strong>Scenario:</strong> {currentTask.scenario}</p>
                    <div className="mt-2">
                      <p className="text-blue-700 text-xs"><strong>Required Functions:</strong> {currentTask.required_functions.join(", ")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area with Spreadsheet */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
              {/* Spreadsheet Container */}
              <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SpreadsheetWorkspace
                  task={currentTask}
                  onActionPerformed={handleActionPerformed}
                  onTaskComplete={handleTaskComplete}
                  readonly={false}
                  showInstructions={true}
                  allowHints={true}
                  onRequestHint={() => {
                    toast.info("Hint: Try using SUM and AVERAGE functions to analyze the sales data.");
                  }}
                />
              </div>
            </div>
            
            {/* Bottom Actions - Always Visible */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  💡 Use Excel functions like SUM, AVERAGE, VLOOKUP to complete the task
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleManualTaskComplete} variant="outline" size="sm">
                    {currentTaskIndex < tasks.length - 1 ? "Skip to Next Task" : "Complete Interview"}
                  </Button>
                  <Button
                    onClick={() => toast.info("Task completion will be automatic based on your progress")}
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Task
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'feedback_generation':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Generating Your Feedback</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our AI is analyzing your responses and performance...
              </p>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          </div>
        );

      case 'conclusion':
        return (
          <div className="w-fit min-w-[400px] max-w-[500px] mx-auto mt-2 border border-indigo-200 rounded-md p-4 m-2 bg-slate-50">
            <div>
              <div className="p-2 font-normal text-base mb-4 whitespace-pre-line">
                <CheckCircleIcon className="h-[2rem] w-[2rem] mx-auto my-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500" />
                <p className="text-lg font-semibold text-center">
                  Thank you for completing the Excel Mock Interview!
                </p>
                <p className="text-center mt-4">
                  Your responses have been recorded and analyzed.
                  {"\n\n"}
                  You completed the AI voice interview and {tasks.length} hands-on Excel task(s).
                  {"\n\n"}
                  🎤 Voice Interview: Discussed your Excel knowledge and experience
                  {"\n"}📊 Practical Tasks: Demonstrated skills with real spreadsheet work
                  {"\n\n"}
                  You can close this tab now.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${currentState === 'practical_tasks' ? 'flex flex-col' : 'flex justify-center items-center'}`}>
      <div className={`bg-white ${currentState === 'practical_tasks' ? 'w-full h-screen flex flex-col' : 'rounded-md md:w-[90%] w-[95%]'}`}>
        <Card className={`${currentState === 'practical_tasks' ? 'h-full flex flex-col border-none shadow-none' : 'min-h-[88vh]'} rounded-lg border-2 border-b-4 border-r-4 border-black text-xl font-bold transition-all md:block dark:border-white`}>
          <div className={currentState === 'practical_tasks' ? 'h-full flex flex-col' : ''}>
            {/* Progress Bar */}
            <div className="m-4 h-[15px] rounded-lg border-[1px] border-black">
              <div
                className="bg-indigo-600 h-[15px] rounded-lg transition-all duration-500"
                style={{
                  width: `${getStateProgress()}%`,
                }}
              />
            </div>
            
            {/* Header */}
            {currentState !== 'practical_tasks' && (
              <CardHeader className="items-center p-1">
                {currentState !== 'conclusion' && (
                  <CardTitle className="flex flex-row items-center text-lg md:text-xl font-bold mb-2">
                    {interview?.name} - Excel Mock Interview
                  </CardTitle>
                )}
                {currentState !== 'conclusion' && currentState !== 'introduction' && (
                  <div className="flex mt-2 flex-row">
                    <AlarmClockIcon
                      className="text-indigo-600 h-[1rem] w-[1rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0 mr-2 font-bold"
                      style={{ color: interview.theme_color }}
                    />
                    <div className="text-sm font-normal">
                      Expected duration:{" "}
                      <span
                        className="font-bold"
                        style={{ color: interview.theme_color }}
                      >
                        {interview.time_duration}
                      </span>
                    </div>
                  </div>
                )}
              </CardHeader>
            )}

            {/* State Content */}
            <div className={currentState === 'practical_tasks' ? 'flex-1 min-h-0' : 'min-h-[60vh]'}>
              {renderStateContent()}
            </div>
          </div>
        </Card>
        
        {/* Footer - Only show when not in practical tasks */}
        {currentState !== 'practical_tasks' && (
          <a
            className="flex flex-row justify-center align-middle mt-3"
            href="https://folo-up.co/"
            target="_blank"
          >
            <div className="text-center text-md font-semibold mr-2">
              Powered by{" "}
              <span className="font-bold">
                Excel Mock Interview
              </span>
            </div>
            <ArrowUpRightSquareIcon className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500" />
          </a>
        )}
      </div>
    </div>
  );
}

export default ExcelInterviewCall;