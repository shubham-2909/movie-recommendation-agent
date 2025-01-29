import mongoose, { Schema, Document } from "mongoose";

interface IQueryLog extends Document {
  originalQuery: string;
  suggestedMovies: string[];
  probingContext: { q: string; a: string }[];
  timestamp: Date;
  success: boolean;
}

const QueryLogSchema = new Schema<IQueryLog>({
  originalQuery: { type: String, required: true },
  suggestedMovies: { type: [String], default: [] },
  probingContext: { type: [{ q: String, a: String }], default: [] },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
});

const QueryLog = mongoose.model<IQueryLog>("QueryLog", QueryLogSchema);

export const saveUserLog = async (
  originalQuery: string,
  suggestedMovies: string[],
  probingContext: { q: string; a: string }[],
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
