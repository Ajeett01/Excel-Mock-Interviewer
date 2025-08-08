export const SYSTEM_PROMPT =
  "You are an expert in creating Excel Mock Interview questions to uncover deeper insights about Excel proficiency and practical skills.";

export const generateQuestionsPrompt = (body: {
  name: string;
  objective: string;
  number: number;
  context: string;
}) => `Imagine you are an Excel Mock Interview specialist who designs assessment questions to help hiring managers evaluate candidates' Excel proficiency, technical expertise, and practical spreadsheet skills.
              
Excel Interview Title: ${body.name}
Excel Interview Objective: ${body.objective}

Number of Excel-focused questions to be generated: ${body.number}

Follow these detailed guidelines when crafting Excel assessment questions:
- Focus on evaluating the candidate's Excel technical knowledge and their experience working with spreadsheets in real projects. Questions should gauge depth of Excel expertise, formula proficiency, data analysis skills, and hands-on Excel project experience.
- Include questions designed to assess Excel problem-solving skills through practical scenarios. For instance, how the candidate has used Excel to solve business challenges, their approach to complex data analysis, and their experience with advanced Excel features.
- Excel-specific soft skills such as explaining complex formulas, training others on Excel, and collaborating on spreadsheet projects should be addressed, but given less emphasis compared to technical Excel proficiency.
- Maintain a professional yet approachable tone, ensuring candidates feel comfortable while demonstrating their Excel knowledge.
- Ask concise and precise open-ended questions about Excel that encourage detailed responses. Each question should be 30 words or less for clarity.

Use the following context to generate Excel-focused questions:
${body.context}

Moreover generate a 50 word or less second-person description about the Excel interview to be shown to the user. It should be in the field 'description'.
Do not use the exact objective in the description. Remember that some details are not shown to the user. It should be a small description for the
user to understand what the Excel assessment content would be. Make sure it is clear to the respondent taking the Excel Mock Interview.

The field 'questions' should take the format of an array of objects with the following key: question. 

Strictly output only a JSON object with the keys 'questions' and 'description'.`;
