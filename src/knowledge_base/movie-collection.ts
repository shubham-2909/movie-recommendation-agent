import fs from "fs";
import csv from "csv-parser";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import { generateEmbedding } from "../utils/generate-embeddings";
import {
  BATCH_SIZE,
  CHROMA_COLLECTION_NAME,
  MOVIES_CSV_PATH,
} from "../config/constants";

dotenv.config();

const chromaClient = new ChromaClient({ path: "http://localhost:8000" });

const readMoviesFromCSV = async () => {
  return new Promise((resolve, reject) => {
    const movies: any[] = [];
    fs.createReadStream(MOVIES_CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        movies.push({
          id: row.id,
          title: row.title,
          genre: row.genres,
          description: row.overview,
          year: row.release_date?.split("-")[0],
          rating: row.vote_average || "N/A",
          keywords: row.keywords || "", // New field
          credits: row.credits || "", // New field
          tagline: row.tagline || "", // New field
          production_companies: row.production_companies || "", // New field
        });
      })
      .on("end", () => {
        console.log(`✅ Loaded ${movies.length} movies from CSV.`);
        resolve(movies);
      })
      .on("error", (error) => reject(error));
  });
};

const setupAndPopulateCollection = async () => {
  console.log(`Reading movies from: ${MOVIES_CSV_PATH}`);
  let movies = (await readMoviesFromCSV()) as any[];
  console.log(`Loaded ${movies.length} movies from CSV.`);

  const uniqueMoviesMap = new Map();
  for (const movie of movies) {
    uniqueMoviesMap.set(movie.id, movie);
  }
  movies = Array.from(uniqueMoviesMap.values());
  console.log(`Removed duplicates. Unique movies count: ${movies.length}`);

  const collections = await chromaClient.listCollections();
  if (collections.includes(CHROMA_COLLECTION_NAME)) {
    await chromaClient.deleteCollection({ name: CHROMA_COLLECTION_NAME });
    console.log(`Deleted existing collection: ${CHROMA_COLLECTION_NAME}`);
  }

  const collection = await chromaClient.createCollection({
    name: CHROMA_COLLECTION_NAME,
  });

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1}...`);

    const batchEmbeddings = await Promise.all(
      batch.map(async (movie) => {
        const text = `${movie.title} ${movie.genre} ${movie.description} ${movie.year} ${movie.rating} ${movie.keywords} ${movie.credits} ${movie.tagline} ${movie.production_companies}`;
        const embedding = await generateEmbedding(text);
        return { id: movie.id, metadata: movie, embedding };
      })
    );

    const validMovies = batchEmbeddings.filter((m) => m.embedding.length > 0);

    if (validMovies.length > 0) {
      await collection.add({
        ids: validMovies.map((m) => m.id),
        metadatas: validMovies.map((m) => m.metadata),
        embeddings: validMovies.map((m) => m.embedding),
      });
      console.log(`Inserted ${validMovies.length} movies into ChromaDB.`);
    }
  }

  console.log("Movies and embeddings added to ChromaDB successfully!");
};

setupAndPopulateCollection().catch((error) => {
  console.error("Error setting up and populating collection:", error);
});
