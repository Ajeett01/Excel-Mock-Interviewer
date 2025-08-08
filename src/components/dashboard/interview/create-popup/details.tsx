import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useClerk, useOrganization } from "@clerk/nextjs";
import { useInterviewers } from "@/contexts/interviewers.context";
import { useInterviews } from "@/contexts/interviews.context";
import { InterviewBase, Question } from "@/types/interview";
import { ChevronRight, ChevronLeft, Info, FileSpreadsheet, Mic } from "lucide-react";
import Image from "next/image";
import { CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FileUpload from "../fileUpload";
import Modal from "@/components/dashboard/Modal";
import InterviewerDetailsModal from "@/components/dashboard/interviewer/interviewerDetailsModal";
import { Interviewer } from "@/types/interviewer";
import ExcelInterviewSetup from "@/components/excel-interview/ExcelInterviewSetup";
import { CreateExcelInterviewRequest, ExcelInterviewConfig } from "@/types/excel";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setLoading: (loading: boolean) => void;
  interviewData: InterviewBase;
  setInterviewData: (interviewData: InterviewBase) => void;
  isUploaded: boolean;
  setIsUploaded: (isUploaded: boolean) => void;
  fileName: string;
  setFileName: (fileName: string) => void;
  setOpen?: (open: boolean) => void;
}

function DetailsPopup({
  open,
  setLoading,
  interviewData,
  setInterviewData,
  isUploaded,
  setIsUploaded,
  fileName,
  setFileName,
  setOpen,
}: Props) {
  const { user } = useClerk();
  const { organization } = useOrganization();
  const { interviewers } = useInterviewers();
  const { fetchInterviews } = useInterviews();
  const [isClicked, setIsClicked] = useState(false);
  const [openInterviewerDetails, setOpenInterviewerDetails] = useState(false);
  const [interviewerDetails, setInterviewerDetails] = useState<Interviewer>();

  const [name, setName] = useState(interviewData.name);
  const [selectedInterviewer, setSelectedInterviewer] = useState(
    interviewData.interviewer_id,
  );
  const [objective, setObjective] = useState(interviewData.objective);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    interviewData.is_anonymous,
  );
  const [numQuestions, setNumQuestions] = useState(
    interviewData.question_count == 0
      ? ""
      : String(interviewData.question_count),
  );
  const [duration, setDuration] = useState(interviewData.time_duration);
  const [uploadedDocumentContext, setUploadedDocumentContext] = useState("");
  const [interviewType, setInterviewType] = useState<'traditional' | 'excel'>('traditional');
  const [showExcelSetup, setShowExcelSetup] = useState(false);

  const slideLeft = (id: string, value: number) => {
    var slider = document.getElementById(`${id}`);
    if (slider) {
      slider.scrollLeft = slider.scrollLeft - value;
    }
  };

  const slideRight = (id: string, value: number) => {
    var slider = document.getElementById(`${id}`);
    if (slider) {
      slider.scrollLeft = slider.scrollLeft + value;
    }
  };

  const onGenrateQuestions = async () => {
    setLoading(true);

    const data = {
      name: name.trim(),
      objective: objective.trim(),
      number: numQuestions,
      context: uploadedDocumentContext,
    };

    const generatedQuestions = (await axios.post(
      "/api/generate-interview-questions",
      data,
    )) as any;

    const generatedQuestionsResponse = JSON.parse(
      generatedQuestions?.data?.response,
    );

    const updatedQuestions = generatedQuestionsResponse.questions.map(
      (question: Question) => ({
        id: uuidv4(),
        question: question.question.trim(),
        follow_up_count: 1,
      }),
    );

    const updatedInterviewData = {
      ...interviewData,
      name: name.trim(),
      objective: objective.trim(),
      questions: updatedQuestions,
      interviewer_id: selectedInterviewer,
      question_count: Number(numQuestions),
      time_duration: duration,
      description: generatedQuestionsResponse.description,
      is_anonymous: isAnonymous,
    };
    setInterviewData(updatedInterviewData);
  };

  const onManual = () => {
    setLoading(true);

    const updatedInterviewData = {
      ...interviewData,
      name: name.trim(),
      objective: objective.trim(),
      questions: [{ id: uuidv4(), question: "", follow_up_count: 1 }],
      interviewer_id: selectedInterviewer,
      question_count: Number(numQuestions),
      time_duration: String(duration),
      description: "",
      is_anonymous: isAnonymous,
    };
    setInterviewData(updatedInterviewData);
  };

  const onCreateExcelInterview = async (config: ExcelInterviewConfig) => {
    try {
      setLoading(true);
      
      if (!user?.id || !organization?.id) {
        toast.error("User or organization not found");
        setLoading(false);
        return;
      }

      const excelInterviewRequest: CreateExcelInterviewRequest = {
        name: name.trim(),
        description: objective.trim(),
        objective: objective.trim(),
        skill_level: config.skill_level,
        config: config,
        organization_id: organization.id,
        user_id: user.id,
        interviewer_id: Number(selectedInterviewer)
      };

      const response = await axios.post("/api/create-excel-interview", excelInterviewRequest);
      
      if (response.data) {
        toast.success("Excel interview created successfully!");
        await fetchInterviews(); // Refresh the interviews list
        setShowExcelSetup(false);
        setLoading(false);
        if (setOpen) {
          setOpen(false); // Close the entire modal
        }
      }
    } catch (error) {
      console.error("Error creating Excel interview:", error);
      toast.error("Failed to create Excel interview. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setName("");
      setSelectedInterviewer(BigInt(0));
      setObjective("");
      setIsAnonymous(false);
      setNumQuestions("");
      setDuration("");
      setIsClicked(false);
    }
  }, [open]);

  return (
    <>
      <div className="text-center w-[38rem]">
        <h1 className="text-xl font-semibold">Create an Interview</h1>
        <div className="flex flex-col justify-center items-start mt-4 ml-10 mr-8">
          {/* Interview Type Selection */}
          <div className="w-full mb-6">
            <h3 className="text-sm font-medium mb-3">Interview Type:</h3>
            <div className="flex gap-4">
              <div
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  interviewType === 'traditional'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setInterviewType('traditional')}
              >
                <div className="flex items-center justify-center mb-2">
                  <Mic className={`w-8 h-8 ${interviewType === 'traditional' ? 'text-indigo-600' : 'text-gray-500'}`} />
                </div>
                <h4 className="font-medium text-center">Traditional Interview</h4>
                <p className="text-xs text-gray-600 text-center mt-1">Voice-based Q&A interview</p>
              </div>
              <div
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  interviewType === 'excel'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setInterviewType('excel')}
              >
                <div className="flex items-center justify-center mb-2">
                  <FileSpreadsheet className={`w-8 h-8 ${interviewType === 'excel' ? 'text-indigo-600' : 'text-gray-500'}`} />
                </div>
                <h4 className="font-medium text-center">Excel Mock Interview</h4>
                <p className="text-xs text-gray-600 text-center mt-1">Hands-on Excel skills assessment</p>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center items-center">
            <h3 className="text-sm font-medium">Interview Name:</h3>
            <input
              type="text"
              className="border-b-2 focus:outline-none border-gray-500 px-2 w-96 py-0.5 ml-3"
              placeholder="e.g. Name of the Interview"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(e.target.value.trim())}
            />
          </div>
          <h3 className="text-sm mt-3 font-medium">Select an Interviewer:</h3>
          <div className="relative flex items-center mt-1">
            <div
              id="slider-3"
              className=" h-36 pt-1 overflow-x-scroll scroll whitespace-nowrap scroll-smooth scrollbar-hide w-[27.5rem]"
            >
              {interviewers.map((item, key) => (
                <div
                  className=" p-0 inline-block cursor-pointer ml-1 mr-5 rounded-xl shrink-0 overflow-hidden"
                  key={item.id}
                >
                  <button
                    className="absolute ml-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInterviewerDetails(item);
                      setOpenInterviewerDetails(true);
                    }}
                  >
                    <Info size={18} color="#4f46e5" strokeWidth={2.2} />
                  </button>
                  <div
                    className={`w-[96px] overflow-hidden rounded-full ${
                      selectedInterviewer === item.id
                        ? "border-4 border-indigo-600"
                        : ""
                    }`}
                    onClick={() => setSelectedInterviewer(item.id)}
                  >
                    <Image
                      src={item.image}
                      alt="Picture of the interviewer"
                      width={70}
                      height={70}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="mt-0 text-xs text-center">
                    {item.name}
                  </CardTitle>
                </div>
              ))}
            </div>
            {interviewers.length > 4 ? (
              <div className="flex-row justify-center ml-3 mb-1 items-center space-y-6">
                <ChevronRight
                  className="opacity-50 cursor-pointer hover:opacity-100"
                  size={27}
                  onClick={() => slideRight("slider-3", 115)}
                />
                <ChevronLeft
                  className="opacity-50 cursor-pointer hover:opacity-100"
                  size={27}
                  onClick={() => slideLeft("slider-3", 115)}
                />
              </div>
            ) : (
              <></>
            )}
          </div>
          <h3 className="text-sm font-medium">Objective:</h3>
          <Textarea
            value={objective}
            className="h-24 mt-2 border-2 border-gray-500 w-[33.2rem]"
            placeholder="e.g. Find best candidates based on their technical skills and previous projects."
            onChange={(e) => setObjective(e.target.value)}
            onBlur={(e) => setObjective(e.target.value.trim())}
          />
          <h3 className="text-sm font-medium mt-2">
            Upload any documents related to the interview.
          </h3>
          <FileUpload
            isUploaded={isUploaded}
            setIsUploaded={setIsUploaded}
            fileName={fileName}
            setFileName={setFileName}
            setUploadedDocumentContext={setUploadedDocumentContext}
          />
          <label className="flex-col mt-7 w-full">
            <div className="flex items-center cursor-pointer">
              <span className="text-sm font-medium">
                Do you prefer the interviewees&apos; responses to be anonymous?
              </span>
              <Switch
                checked={isAnonymous}
                className={`ml-4 mt-1 ${
                  isAnonymous ? "bg-indigo-600" : "bg-[#E6E7EB]"
                }`}
                onCheckedChange={(checked) => setIsAnonymous(checked)}
              />
            </div>
            <span
              style={{ fontSize: "0.7rem", lineHeight: "0.66rem" }}
              className="font-light text-xs italic w-full text-left block"
            >
              Note: If not anonymous, the interviewee&apos;s email and name will
              be collected.
            </span>
          </label>
          <div className="flex flex-row gap-3 justify-between w-full mt-3">
            <div className="flex flex-row justify-center items-center ">
              <h3 className="text-sm font-medium ">Number of Questions:</h3>
              <input
                type="number"
                step="1"
                max="5"
                min="1"
                className="border-b-2 text-center focus:outline-none  border-gray-500 w-14 px-2 py-0.5 ml-3"
                value={numQuestions}
                onChange={(e) => {
                  let value = e.target.value;
                  if (
                    value === "" ||
                    (Number.isInteger(Number(value)) && Number(value) > 0)
                  ) {
                    if (Number(value) > 5) {
                      value = "5";
                    }
                    setNumQuestions(value);
                  }
                }}
              />
            </div>
            <div className="flex flex-row justify-center items-center">
              <h3 className="text-sm font-medium ">Duration (mins):</h3>
              <input
                type="number"
                step="1"
                max="10"
                min="1"
                className="border-b-2 text-center focus:outline-none  border-gray-500 w-14 px-2 py-0.5 ml-3"
                value={duration}
                onChange={(e) => {
                  let value = e.target.value;
                  if (
                    value === "" ||
                    (Number.isInteger(Number(value)) && Number(value) > 0)
                  ) {
                    if (Number(value) > 10) {
                      value = "10";
                    }
                    setDuration(value);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex flex-row w-full justify-center items-center space-x-24 mt-5">
            {interviewType === 'traditional' ? (
              <>
                <Button
                  disabled={
                    (name &&
                    objective &&
                    numQuestions &&
                    duration &&
                    selectedInterviewer != BigInt(0)
                      ? false
                      : true) || isClicked
                  }
                  className="bg-indigo-600 hover:bg-indigo-800  w-40"
                  onClick={() => {
                    setIsClicked(true);
                    onGenrateQuestions();
                  }}
                >
                  Generate Questions
                </Button>
                <Button
                  disabled={
                    (name &&
                    objective &&
                    numQuestions &&
                    duration &&
                    selectedInterviewer != BigInt(0)
                      ? false
                      : true) || isClicked
                  }
                  className="bg-indigo-600 w-40 hover:bg-indigo-800"
                  onClick={() => {
                    setIsClicked(true);
                    onManual();
                  }}
                >
                  I&apos;ll do it myself
                </Button>
              </>
            ) : (
              <Button
                disabled={!name.trim() || isClicked}
                className="bg-indigo-600 hover:bg-indigo-800 w-60"
                onClick={() => {
                  setIsClicked(true);
                  setShowExcelSetup(true);
                }}
              >
                Configure Excel Interview
              </Button>
            )}
          </div>
        </div>
      </div>
      <Modal
        open={openInterviewerDetails}
        closeOnOutsideClick={true}
        onClose={() => {
          setOpenInterviewerDetails(false);
        }}
      >
        <InterviewerDetailsModal interviewer={interviewerDetails} />
      </Modal>
      
      <Modal
        open={showExcelSetup}
        closeOnOutsideClick={false}
        onClose={() => {
          setShowExcelSetup(false);
          setIsClicked(false);
        }}
      >
        <ExcelInterviewSetup
          onStartInterview={(config) => {
            onCreateExcelInterview(config);
          }}
          onCancel={() => {
            setShowExcelSetup(false);
            setIsClicked(false);
          }}
        />
      </Modal>
    </>
  );
}

export default DetailsPopup;
