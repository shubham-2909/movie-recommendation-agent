import { ChromaClient } from "chromadb";

export const chromaClient = new ChromaClient({
  path: process.env.CHROMADB_URL || "http://localhost:8000",
});
