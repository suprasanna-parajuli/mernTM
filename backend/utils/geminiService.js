import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

/**
 * GEMINI AI SERVICE
 *
 * Analyzes PDF study materials using Google's Gemini AI
 * Provides summaries, key points, and study recommendations
 */

// Initialize Gemini AI
// NOTE: You need to add GEMINI_API_KEY to your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyze PDF content and extract study insights
 * @param {string} pdfPath - Path to PDF file
 * @param {string} materialTitle - Title of study material
 * @param {string} tag - Type of material (study, revision, notes, etc.)
 * @returns {object} - Analysis results
 */
export async function analyzePDF(pdfPath, materialTitle, tag) {
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.log("⚠️  Gemini API key not set - skipping AI analysis");
      return {
        summary: "AI analysis unavailable - add GEMINI_API_KEY to .env",
        keyPoints: [],
        difficulty: "medium",
        estimatedTime: 0,
      };
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Read PDF file (simplified - in production you'd extract text from PDF)
    // For now, we'll analyze based on filename and metadata
    const prompt = `
You are an AI study assistant. Analyze this study material:

Title: ${materialTitle}
Type: ${tag}
File: PDF document

Based on this information, provide:
1. A brief summary (2-3 sentences) of what this material likely contains
2. 3-5 key points students should focus on
3. Estimated difficulty level (easy/medium/hard)
4. Estimated time to study (in hours)

Format your response as JSON:
{
  "summary": "brief summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "difficulty": "medium",
  "estimatedTime": 2
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    try {
      // Extract JSON from response (remove markdown code blocks if present)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log("✨ Gemini AI analysis complete");
        return analysis;
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
    }

    // Fallback response if parsing fails
    return {
      summary: `Study material about ${materialTitle}`,
      keyPoints: ["Review main concepts", "Practice problems", "Make notes"],
      difficulty: "medium",
      estimatedTime: 2,
    };
  } catch (error) {
    console.error("Gemini AI error:", error.message);

    // Return fallback response
    return {
      summary: `Study material: ${materialTitle}`,
      keyPoints: ["Read through material", "Take notes", "Review key concepts"],
      difficulty: "medium",
      estimatedTime: 2,
    };
  }
}

/**
 * Generate study tips for a material
 * @param {object} material - Study material object
 * @returns {array} - Array of study tips
 */
export async function generateStudyTips(material) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return ["Review regularly", "Take breaks", "Practice recall"];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Generate 3 specific study tips for this material:

Title: ${material.title}
Type: ${material.tag}
Progress: ${material.progress}%
Time Spent: ${material.timeSpent} minutes
Target: ${material.targetHours} hours

Provide actionable, specific tips as a JSON array:
["tip 1", "tip 2", "tip 3"]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    // Fallback
    return ["Review regularly", "Practice active recall", "Summarize in your own words"];
  } catch (error) {
    console.error("Gemini tips error:", error);
    return ["Break into smaller chunks", "Use spaced repetition", "Test yourself"];
  }
}
