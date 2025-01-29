import { chromaClient } from "../config/chroma";
import { generateEmbedding } from "../utils/generate-embeddings";

// Dummy embedding function to satisfy TypeScript
const dummyEmbeddingFunction = {
  generate: async () => {
    throw new Error("Embedding generation is not allowed during query phase.");
  },
};

// Perform vector search using the query embedding
export const searchMovies = async (query: string) => {
  // Pass the dummy embedding function to satisfy ChromaDB's type constraints
  const collection = await chromaClient.getCollection({
    name: "movie_collection",
    embeddingFunction: dummyEmbeddingFunction, // No-op function for query phase
  });

  const queryEmbedding = await generateEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 3, // Return the top 3 matches
  });

  return results;
};
