import { OpenAI } from "openai";
import { searchMovies } from "../knowledge_base/vector-search";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const prompt = `
  The user has refined their movie search with the following inputs:
  ${previousQueries.map((q) => `• ${q}`).join("\n")}

  A follow-up question was asked: "${question}"
  The user responded: "${answer}"

  ✅ **Rules**:
  - Generate a refined search query (max **15 words**) incorporating the latest response.
  - **Do NOT include the original question** or any yes/no responses.
  - Ensure the query is **concise, natural, and highly relevant** for a movie search.
  - The output must be **only the refined search phrase**, without extra commentary.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // ✅ Best model for precise query refinement
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    // ✅ Ensure the output is a clean search phrase
    let refinedQuery = response.choices[0]?.message?.content?.trim() || answer;
    refinedQuery = refinedQuery.replace(/^["'`\-\•\d\.]+/, "").trim(); // ✅ Remove unintended formatting

    return refinedQuery;
  } catch (error) {
    console.error("Error refining query:", error);
    return answer; // Fallback to raw user input if OpenAI fails
  }
};

/**
 * Generates the first follow-up question based on user input.
 * @param userQuery The initial user query.
 * @returns A high-quality first follow-up question.
 */
export const generateFirstFollowUpQuestion = async (
  userQuery: string
): Promise<string> => {
  const prompt = `
  The user is searching for: "${userQuery}". Generate **one high-quality follow-up question**.

  ✅ **Rules**:
  - The question must **refine user preferences**, not ask about general facts.
  - It should focus on **movie attributes** (genre, style, actors, themes) instead of trivia.
  - **Do NOT ask about movie history, famous roles, or factual information**.
  - Keep it **short, direct, and highly specific**.
  - **Do NOT include numbers, dashes, or bullet points**.
  - Ensure the question **adds depth to their movie preference**.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Faster model for follow-up questions
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return (
      response.choices[0]?.message?.content
        ?.trim()
        .replace(/^[-\d\.\•]+\s*/, "") ||
      "What specific type of comedy movies do you enjoy?"
    );
  } catch (error) {
    console.error("Error generating first follow-up question:", error);
    return "What specific type of comedy movies do you enjoy?";
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
  const prompt = `
  A user was asked: "${previousQuestion}"
  They responded: "${previousAnswer}"

  ✅ **Rules**:
  - Generate a **high-quality** next follow-up question that builds on their response.
  - Focus on **user preferences related to movies**, not factual information.
  - **Do NOT ask about specific actors' careers, historical roles, or movie trivia**.
  - Ensure it **adds depth to their movie preferences**.
  - **Do NOT start with numbers, dashes, or bullet points**.
  - The question should refine their search, not test their knowledge.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Faster model for follow-up questions
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return (
      response.choices[0]?.message?.content
        ?.trim()
        .replace(/^[-\d\.\•]+\s*/, "") ||
      "Do you prefer lighthearted comedy or satire?"
    );
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return "Do you prefer lighthearted comedy or satire?";
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
