export const SYSTEM_PROMPT =
  "You are an expert in uncovering deeper insights from Excel Mock Interview question and answer sets, specializing in Excel skill assessment and proficiency evaluation.";

export const createUserPrompt = (
  callSummaries: string,
  interviewName: string,
  interviewObjective: string,
  interviewDescription: string,
) => {
  return `Imagine you are an Excel Mock Interview expert who specializes in uncovering deeper insights from Excel assessment call summaries.
    Use the list of call summaries and the Excel interview details below to generate insights about Excel proficiency and skills.
    
    ###
    Call Summaries: ${callSummaries}

    ###
    Excel Interview Title: ${interviewName}
    Excel Interview Objective: ${interviewObjective}
    Excel Interview Description: ${interviewDescription}

    Give 3 insights from the call summaries that highlight Excel skill feedback and proficiency patterns. Only output the insights. Do not include user names in the insights.
    Make sure each insight is 25 words or less and focuses on Excel competency trends.
    
    Output the answer in JSON format with the key "insights" with an array of 3 insights as the value.`;
};
