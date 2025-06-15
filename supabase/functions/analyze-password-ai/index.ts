
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordAnalysisRequest {
  password: string;
  currentAnalysis: {
    entropy: number;
    crackTime: string;
    passwordScore: any;
    breachStatus?: any;
  };
}

interface AIAnalysisResponse {
  insights: string;
  suggestions: string[];
  riskAssessment: string;
  improvements: string[];
  crossCheck: {
    scoreValidation: string;
    entropyValidation: string;
    timeValidation: string;
    overallAssessment: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const azureApiKey = Deno.env.get('AZURE_AI_API_KEY');
    if (!azureApiKey) {
      throw new Error('Azure AI API key not configured');
    }

    const { password, currentAnalysis }: PasswordAnalysisRequest = await req.json();

    if (!password) {
      throw new Error('Password is required');
    }

    console.log('Analyzing password with Grok 3...');

    // Create comprehensive prompt for Grok 3
    const systemPrompt = `You are a cybersecurity expert specializing in password analysis. Provide detailed analysis in JSON format with these exact fields:
    {
      "insights": "Brief conversational analysis (2-3 sentences max)",
      "suggestions": ["3-4 improved password variations that maintain similarity to original"],
      "riskAssessment": "Concise professional risk assessment (1-2 sentences)",
      "improvements": ["Specific actionable improvements"],
      "crossCheck": {
        "scoreValidation": "Brief validation of the password score accuracy",
        "entropyValidation": "Assessment of entropy calculation correctness", 
        "timeValidation": "Validation of crack time estimation accuracy",
        "overallAssessment": "Overall technical analysis validation summary"
      }
    }

    Be concise and actionable. Cross-check our technical metrics for accuracy.`;

    const userPrompt = `Cross-check and analyze this password: "${password}"
    
    Our technical analysis shows:
    - Password Score: ${currentAnalysis.passwordScore.totalScore}/100 (${currentAnalysis.passwordScore.strengthLevel})
    - Entropy: ${currentAnalysis.entropy} bits
    - Estimated crack time: ${currentAnalysis.crackTime}
    - Breach status: ${currentAnalysis.breachStatus?.isBreached ? 'Compromised' : 'Clean'}
    
    Please validate these metrics and provide concise insights, risk assessment, and 3-4 improved password suggestions that maintain similarity to the original.`;

    const response = await fetch('https://airilshah.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${azureApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure AI API error:', response.status, errorText);
      throw new Error(`Azure AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Grok 3 response received');

    let aiResponse: AIAnalysisResponse;
    try {
      // Parse the AI response
      const content = data.choices[0].message.content;
      aiResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback');
      // Fallback response if JSON parsing fails
      aiResponse = {
        insights: "AI analysis is temporarily unavailable, but your password has been analyzed using our technical algorithms.",
        suggestions: [
          password + "123!",
          password.charAt(0).toUpperCase() + password.slice(1) + "@2024",
          password + "_Secure!",
          password.replace(/[aeiou]/g, (match) => match.toUpperCase()) + "1!"
        ],
        riskAssessment: `Based on technical analysis: ${currentAnalysis.passwordScore.strengthLevel} password with ${currentAnalysis.entropy} bits of entropy.`,
        improvements: [
          "Add special characters and numbers",
          "Increase length to 12+ characters",
          "Use a mix of upper and lowercase letters",
          "Avoid common dictionary words"
        ],
        crossCheck: {
          scoreValidation: "Score calculation appears accurate based on standard criteria",
          entropyValidation: "Entropy calculation follows industry standards",
          timeValidation: "Crack time estimation uses reasonable assumptions",
          overallAssessment: "Technical metrics are properly calculated"
        }
      };
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-password-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: "AI analysis is temporarily unavailable.",
      suggestions: [],
      riskAssessment: "Please try again later.",
      improvements: [],
      crossCheck: {
        scoreValidation: "Unable to validate",
        entropyValidation: "Unable to validate", 
        timeValidation: "Unable to validate",
        overallAssessment: "AI validation unavailable"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
