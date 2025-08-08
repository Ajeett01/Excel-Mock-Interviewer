import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  ExcelInterview,
  ExcelInterviewConfig,
  ExcelSkillLevel,
  CreateExcelInterviewRequest
} from "@/types/excel";
import { ExcelSkillConfigService } from "./excel-skill-config.service";

const supabase = createClientComponentClient();

const getAllInterviews = async (userId: string, organizationId: string) => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("interview")
      .select(`*`)
      .or(`organization_id.eq.${organizationId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    return [...(clientData || [])];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getInterviewById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`*`)
      .or(`id.eq.${id},readable_slug.eq.${id}`);

    return data ? data[0] : null;
  } catch (error) {
    console.log(error);

    return [];
  }
};

const updateInterview = async (payload: any, id: string) => {
  const { error, data } = await supabase
    .from("interview")
    .update({ ...payload })
    .eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const deleteInterview = async (id: string) => {
  const { error, data } = await supabase
    .from("interview")
    .delete()
    .eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const getAllRespondents = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`respondents`)
      .eq("interview_id", interviewId);

    return data || [];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const createInterview = async (payload: any) => {
  const { error, data } = await supabase
    .from("interview")
    .insert({ ...payload });
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const deactivateInterviewsByOrgId = async (organizationId: string) => {
  try {
    const { error } = await supabase
      .from("interview")
      .update({ is_active: false })
      .eq("organization_id", organizationId)
      .eq("is_active", true); // Optional: only update if currently active

    if (error) {
      console.error("Failed to deactivate interviews:", error);
    }
  } catch (error) {
    console.error("Unexpected error disabling interviews:", error);
  }
};

// Excel-specific interview methods
const createExcelInterview = async (payload: CreateExcelInterviewRequest) => {
  try {
    // Call the API endpoint to generate Excel content server-side
    const response = await fetch('/api/create-excel-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Excel interview: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in createExcelInterview:", error);
    
    return null;
  }
};

const getExcelInterviews = async (userId: string, organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`*`)
      .or(`organization_id.eq.${organizationId},user_id.eq.${userId}`)
      .eq("interview_type", "excel")
      .order("created_at", { ascending: false });

    return data || [];
  } catch (error) {
    console.error("Error fetching Excel interviews:", error);
    
    return [];
  }
};

const updateExcelInterview = async (id: string, updates: Partial<ExcelInterview>) => {
  try {
    const { error, data } = await supabase
      .from("interview")
      .update(updates)
      .eq("id", id)
      .eq("interview_type", "excel")
      .select();

    if (error) {
      console.error("Error updating Excel interview:", error);
      
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in updateExcelInterview:", error);
    
    return null;
  }
};

const getExcelInterviewById = async (id: string): Promise<ExcelInterview | null> => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`*`)
      .or(`id.eq.${id},readable_slug.eq.${id}`)
      .eq("interview_type", "excel")
      .single();

    if (error) {
      console.error("Error fetching Excel interview:", error);
      
      return null;
    }

    return data as ExcelInterview;
  } catch (error) {
    console.error("Error in getExcelInterviewById:", error);
    
    return null;
  }
};

const getExcelInterviewStats = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`
        id,
        excel_skill_level,
        response_count,
        created_at,
        response(
          id,
          excel_analytics,
          current_state,
          is_ended
        )
      `)
      .eq("organization_id", organizationId)
      .eq("interview_type", "excel");

    if (error) {
      console.error("Error fetching Excel interview stats:", error);
      
      return null;
    }

    // Process stats
    const stats = {
      totalInterviews: data.length,
      totalResponses: data.reduce((sum, interview) => sum + (interview.response_count || 0), 0),
      skillLevelDistribution: data.reduce((acc: any, interview) => {
        const level = interview.excel_skill_level;
        acc[level] = (acc[level] || 0) + 1;
        
        return acc;
      }, {}),
      completionRate: 0, // Would calculate from responses
      averageScore: 0    // Would calculate from analytics
    };

    return stats;
  } catch (error) {
    console.error("Error in getExcelInterviewStats:", error);
    
    return null;
  }
};

const cloneExcelInterview = async (originalId: string, newName: string, userId: string) => {
  try {
    const original = await getExcelInterviewById(originalId);
    if (!original) {
      throw new Error("Original interview not found");
    }

    // Create a copy with new name and reset stats
    const cloneData = {
      ...original,
      id: undefined, // Let database generate new ID
      name: newName,
      created_at: undefined,
      response_count: 0,
      url: undefined, // Will be generated
      readable_slug: undefined, // Will be generated
      user_id: userId
    };

    const { error, data } = await supabase
      .from("interview")
      .insert(cloneData)
      .select();

    if (error) {
      console.error("Error cloning Excel interview:", error);
      
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in cloneExcelInterview:", error);
    
    return null;
  }
};

export const InterviewService = {
  // Original methods
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getAllRespondents,
  createInterview,
  deactivateInterviewsByOrgId,
  
  // Excel-specific methods
  createExcelInterview,
  getExcelInterviews,
  updateExcelInterview,
  getExcelInterviewById,
  getExcelInterviewStats,
  cloneExcelInterview,
};
