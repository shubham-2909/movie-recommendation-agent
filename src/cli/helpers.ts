import { OpenAI } from "openai";
import { searchMovies } from "../knowledge_base/vector-search";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates the first follow-up question based on user input.
 * @param userQuery The initial user query.
 * @returns A high-quality first follow-up question.
 */
export const generateFirstFollowUpQuestion = async (
  userQuery: string
): Promise<string> => {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a smart movie recommendation agent. Your goal is to ask refined follow-up questions based on user input to narrow down their movie preferences. 

      **Guidelines:**
      - Keep questions short, specific, and engaging.
      - Start with broad questions, then narrow down based on user responses.
      - Always offer **two options** when possible to guide decision-making.
      - Avoid movie trivia, historical facts, or actor biographies.

      **Example Probing Questions:**
      - What genre are you interested in? (e.g., Action, Comedy, Thriller)
      - Do you prefer recent movies or classics?
      - Any specific actors or directors you like?
      - Are you looking for something family-friendly or mature content?
      - What’s your mood (e.g., feel-good, intense, romantic)?

      **Conversational Intelligence:**
      - If the user provides a genre (e.g., "I love sci-fi"), follow up with:  
        *Do you prefer space exploration or futuristic themes?*
      - If the user says they like thrillers, ask:  
        *Psychological thrillers or action-packed ones?*
      `,
    },
    {
      role: "user",
      content: `The user is searching for: "${userQuery}". Generate **one high-quality follow-up question**.`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "What specific type of movies do you enjoy?"
    );
  } catch (error) {
    console.error("Error generating first follow-up question:", error);
    return "What specific type of movies do you enjoy?";
  }
};

/**
 * Generates follow-up questions based on previous answers.
 * @param previousQuestion The last question asked.
 * @param previousAnswer The user's response to that question.
 * @returns The next follow-up question.
 */
export const generateNextFollowUpQuestion = async (
  previousQuestion: string,
  previousAnswer: string
): Promise<string> => {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a smart movie recommendation agent. Your goal is to refine the user's preferences by asking contextual follow-up questions with two options.

      **Guidelines:**
      - Base follow-up questions on the user’s last answer.
      - Always **provide two relevant options** to guide the user's choice.
      - Avoid factual trivia and focus on user preferences.
      - Ensure the question helps **narrow down the search**.

      **Example Dynamic Follow-Ups:**
      - If the user says "I love sci-fi":  
        Do you prefer space exploration or futuristic themes?
      - If the user says "I like thrillers":  
        Psychological thrillers or action-packed ones?
      - If they prefer classics:  
        Black-and-white classics or 80s/90s cult favorites?
      `,
    },
    {
      role: "user",
      content: `A user was asked: "${previousQuestion}"  
      They responded: "${previousAnswer}"  
      Generate the **next follow-up question** with **two options**.`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "Do you prefer lighthearted comedy or satire?"
    );
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return "Do you prefer lighthearted comedy or satire?";
  }
};

/**
 * Generates a refined search query considering context.
 * @param previousQueries List of previous queries for context.
 * @param question The follow-up question asked.
 * @param answer The user's response.
 * @returns A well-structured cumulative search query.
 */
export const generateRefinedQuery = async (
  previousQueries: string[],
  question: string,
  answer: string
): Promise<string> => {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a movie recommendation AI that refines search queries based on user interactions. Your task is to generate a concise, optimized search query (max **15 words**) incorporating the user's latest response.

      **Guidelines:**
      - Avoid including yes/no responses.
      - The final query should be **highly relevant and natural** for movie searches.
      - Do not repeat the original question.
      `,
    },
    {
      role: "user",
      content: `Previous search inputs:
      ${previousQueries.map((q) => `• ${q}`).join("\n")}

      Follow-up question: "${question}"
      User response: "${answer}"
     
      Generate the final **search query** (max 15 words).
      
      Rule: Don't generate query with duplicate words
      `,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages,
      temperature: 0.5,
    });

    let refinedQuery = response.choices[0]?.message?.content?.trim() || answer;
    refinedQuery = refinedQuery.replace(/^["'`\-\•\d\.]+/, "").trim();

    return refinedQuery;
  } catch (error) {
    console.error("Error refining query:", error);
    return answer;
  }
};

/**
 * Searches for movies based on a cumulative query.
 * @param query Full search query incorporating all previous inputs.
 * @returns List of recommended movies.
 */
export const getMovieRecommendations = async (
  query: string
): Promise<any[]> => {
  console.log(chalk.green(`Searching for movies based on: "${query}"`));
  console.log(chalk.magentaBright("Finding recommendations..."));

  const results = await searchMovies(query);
  return results.metadatas?.[0] || [];
};
