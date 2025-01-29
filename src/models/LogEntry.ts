import mongoose, { Schema, Document } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ✅ Define Interface for TypeScript Safety
interface IQueryLog extends Document {
  originalQuery: string;
  suggestedMovies: string[];
  probingContext: string[];
  timestamp: Date;
  success: boolean;
}

// ✅ Define Schema for Logging User Queries
const QueryLogSchema = new Schema<IQueryLog>({
  originalQuery: { type: String, required: true },
  suggestedMovies: { type: [String], default: [] },
  probingContext: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
});

const QueryLog = mongoose.model<IQueryLog>("QueryLog", QueryLogSchema);

/**
 * Logs user queries, interactions, and success status in the database.
 * @param originalQuery The initial user input.
 * @param suggestedMovies List of recommended movies.
 * @param probingContext The refined queries generated during follow-ups.
 * @param success Boolean flag (`true` if user was satisfied, `false` otherwise).
 */
export const saveUserLog = async (
  originalQuery: string,
  suggestedMovies: string[],
  probingContext: string[],
  success: boolean
): Promise<void> => {
  try {
    const newLog = new QueryLog({
      originalQuery,
      suggestedMovies,
      probingContext,
      success,
    });

    await newLog.save();
  } catch (error) {
    console.error("❌ Error logging user query:", error);
  }
};
