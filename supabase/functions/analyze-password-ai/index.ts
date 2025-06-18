
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, currentAnalysis } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required for analysis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const azureApiKey = Deno.env.get('AZURE_AI_API_KEY');
    if (!azureApiKey) {
      return new Response(
        JSON.stringify({ error: 'Azure AI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = `Analyze this password for security and provide detailed insights: "${password}"

Current analysis data:
- Entropy: ${currentAnalysis?.entropy || 'N/A'}
- Estimated crack time: ${currentAnalysis?.crackTime || 'N/A'}
- Password score: ${currentAnalysis?.passwordScore?.score || 'N/A'}%
- Breach status: ${currentAnalysis?.breachStatus?.isBreached ? 'Compromised' : 'Safe'}

Please provide a comprehensive analysis in this exact JSON format:
{
  "insights": "Detailed analysis of the password's strengths and weaknesses",
  "suggestions": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"],
  "riskAssessment": "Overall risk level and explanation",
  "improvements": ["Improvement 1", "Improvement 2"],
  "crossCheck": {
    "scoreValidation": "Validation of the password score",
    "entropyValidation": "Assessment of entropy calculation",
    "timeValidation": "Assessment of crack time estimation",
    "overallAssessment": "Final security assessment"
  }
}`;

    const response = await fetch('https://airilshah.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${azureApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert specializing in password analysis. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error(`AI API request failed: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error analyzing password with AI:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze password with AI',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
