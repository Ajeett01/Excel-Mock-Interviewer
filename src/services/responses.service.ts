import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  ExcelResponse,
  ExcelAnalytics,
  ExcelInterviewState,
  SpreadsheetResult
} from "@/types/excel";
import { ExcelInterviewSessionService } from "./excel-interview-session.service";

const supabase = createClientComponentClient();

const createResponse = async (payload: any) => {
  const { error, data } = await supabase
    .from("response")
    .insert({ ...payload })
    .select("id");

  if (error) {
    console.log(error);

    return [];
  }

  return data[0]?.id;
};

const saveResponse = async (payload: any, call_id: string) => {
  const { error, data } = await supabase
    .from("response")
    .update({ ...payload })
    .eq("call_id", call_id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const getAllResponses = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`*`)
      .eq("interview_id", interviewId)
      .or(`details.is.null, details->call_analysis.not.is.null`)
      .eq("is_ended", true)
      .order("created_at", { ascending: false });

    return data || [];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getResponseCountByOrganizationId = async (
  organizationId: string,
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("interview")
      .select("response(id)", { count: "exact", head: true }) // join + count
      .eq("organization_id", organizationId);

    return count ?? 0;
  } catch (error) {
    console.log(error);

    return 0;
  }
};

const getAllEmailAddressesForInterview = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`email`)
      .eq("interview_id", interviewId);

    return data || [];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getResponseByCallId = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`*`)
      .filter("call_id", "eq", id);

    return data ? data[0] : null;
  } catch (error) {
    console.log(error);

    return [];
  }
};

const deleteResponse = async (id: string) => {
  const { error, data } = await supabase
    .from("response")
    .delete()
    .eq("call_id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const updateResponse = async (payload: any, call_id: string) => {
  const { error, data } = await supabase
    .from("response")
    .update({ ...payload })
    .eq("call_id", call_id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

// Excel-specific response methods
const createExcelResponse = async (payload: Partial<ExcelResponse>) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .insert({
        ...payload,
        current_state: 'introduction',
        state_transitions: [],
        excel_analytics: null,
        spreadsheet_results: []
      })
      .select("id");

    if (error) {
      console.error("Error creating Excel response:", error);
      
      return null;
    }

    return data[0]?.id;
  } catch (error) {
    console.error("Error in createExcelResponse:", error);
    
    return null;
  }
};

const updateExcelResponse = async (callId: string, updates: Partial<ExcelResponse>) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .update(updates)
      .eq("call_id", callId)
      .select();

    if (error) {
      console.error("Error updating Excel response:", error);
      
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in updateExcelResponse:", error);
    
    return null;
  }
};

const getExcelResponses = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`
        *,
        interview!inner(interview_type)
      `)
      .eq("interview_id", interviewId)
      .eq("interview.interview_type", "excel")
      .eq("is_ended", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching Excel responses:", error);
      
      return [];
    }

    return data as ExcelResponse[];
  } catch (error) {
    console.error("Error in getExcelResponses:", error);
    
    return [];
  }
};

const getExcelResponseByCallId = async (callId: string): Promise<ExcelResponse | null> => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`
        *,
        interview!inner(interview_type)
      `)
      .eq("call_id", callId)
      .eq("interview.interview_type", "excel")
      .single();

    if (error) {
      console.error("Error fetching Excel response:", error);
      
      return null;
    }

    return data as ExcelResponse;
  } catch (error) {
    console.error("Error in getExcelResponseByCallId:", error);
    
    return null;
  }
};

const saveSpreadsheetResult = async (responseId: number, result: SpreadsheetResult) => {
  try {
    // First, get current spreadsheet results
    const { data: currentResponse, error: fetchError } = await supabase
      .from("response")
      .select("spreadsheet_results")
      .eq("id", responseId)
      .single();

    if (fetchError) {
      console.error("Error fetching current response:", fetchError);
      
      return false;
    }

    // Add new result to existing results
    const currentResults = currentResponse.spreadsheet_results || [];
    const updatedResults = [...currentResults, result];

    // Update the response
    const { error: updateError } = await supabase
      .from("response")
      .update({ spreadsheet_results: updatedResults })
      .eq("id", responseId);

    if (updateError) {
      console.error("Error saving spreadsheet result:", updateError);
      
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveSpreadsheetResult:", error);
    
    return false;
  }
};

const updateExcelState = async (callId: string, newState: ExcelInterviewState, stateData?: any) => {
  try {
    // Get current response
    const currentResponse = await getExcelResponseByCallId(callId);
    if (!currentResponse) {
      throw new Error("Response not found");
    }

    // Create state transition record
    const transition = {
      from_state: currentResponse.current_state,
      to_state: newState,
      timestamp: new Date(),
      trigger: 'api_update',
      data: stateData
    };

    // Update response with new state
    const updates = {
      current_state: newState,
      state_transitions: [...(currentResponse.state_transitions || []), transition]
    };

    const { error } = await supabase
      .from("response")
      .update(updates)
      .eq("call_id", callId);

    if (error) {
      console.error("Error updating Excel state:", error);
      
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateExcelState:", error);
    
    return false;
  }
};

const generateAndSaveAnalytics = async (callId: string) => {
  try {
    // Call the server-side API to generate analytics
    const response = await fetch('/api/generate-excel-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate analytics: ${response.statusText}`);
    }

    const analytics = await response.json();
    return analytics;
  } catch (error) {
    console.error("Error in generateAndSaveAnalytics:", error);
    
    return null;
  }
};

const getExcelResponseStats = async (interviewId: string) => {
  try {
    const responses = await getExcelResponses(interviewId);
    
    const stats = {
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.current_state === 'conclusion').length,
      averageScore: 0,
      averageDuration: 0,
      stateDistribution: {} as { [key: string]: number },
      skillLevelPerformance: {} as { [key: string]: { count: number; avgScore: number } }
    };

    if (responses.length === 0) {
      return stats;
    }

    // Calculate averages
    const completedWithAnalytics = responses.filter(r => r.excel_analytics);
    if (completedWithAnalytics.length > 0) {
      stats.averageScore = completedWithAnalytics.reduce((sum, r) =>
        sum + (r.excel_analytics?.overall_score || 0), 0
      ) / completedWithAnalytics.length;

      stats.averageDuration = completedWithAnalytics.reduce((sum, r) =>
        sum + (r.duration || 0), 0
      ) / completedWithAnalytics.length;
    }

    // State distribution
    responses.forEach(response => {
      const state = response.current_state;
      stats.stateDistribution[state] = (stats.stateDistribution[state] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error in getExcelResponseStats:", error);
    
    return null;
  }
};

const exportExcelResponseData = async (callId: string, format: 'json' | 'csv') => {
  try {
    const response = await getExcelResponseByCallId(callId);
    if (!response) {
      throw new Error("Response not found");
    }

    const exportData = {
      response: {
        id: response.id,
        name: response.name,
        email: response.email,
        duration: response.duration,
        created_at: response.created_at,
        current_state: response.current_state
      },
      analytics: response.excel_analytics,
      spreadsheetResults: response.spreadsheet_results,
      stateTransitions: response.state_transitions
    };

    if (format === 'json') {
      return {
        data: JSON.stringify(exportData, null, 2),
        filename: `excel-response-${callId}.json`,
        mimeType: 'application/json'
      };
    } else {
      // Simple CSV export - in real implementation, this would be more sophisticated
      const csvData = [
        'Field,Value',
        `Name,${response.name || 'Anonymous'}`,
        `Email,${response.email}`,
        `Duration,${response.duration}`,
        `State,${response.current_state}`,
        `Overall Score,${response.excel_analytics?.overall_score || 'N/A'}`
      ].join('\n');

      return {
        data: csvData,
        filename: `excel-response-${callId}.csv`,
        mimeType: 'text/csv'
      };
    }
  } catch (error) {
    console.error("Error in exportExcelResponseData:", error);
    
    return null;
  }
};

export const ResponseService = {
  // Original methods
  createResponse,
  saveResponse,
  updateResponse,
  getAllResponses,
  getResponseByCallId,
  deleteResponse,
  getResponseCountByOrganizationId,
  getAllEmails: getAllEmailAddressesForInterview,
  
  // Excel-specific methods
  createExcelResponse,
  updateExcelResponse,
  getExcelResponses,
  getExcelResponseByCallId,
  saveSpreadsheetResult,
  updateExcelState,
  generateAndSaveAnalytics,
  getExcelResponseStats,
  exportExcelResponseData,
};
