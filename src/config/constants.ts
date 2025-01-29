import path from "path";

export const BASE_DIR = process.cwd();
export const MOVIES_CSV_PATH = path.join(BASE_DIR, "data", "movies.csv");
export const CHROMA_COLLECTION_NAME = "movie_collection";
export const BATCH_SIZE = 1000;
