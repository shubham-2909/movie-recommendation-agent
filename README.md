Movie Collection CLI

This project allows you to process a large movie dataset, store it in ChromaDB, and run a CLI-based application to interact with the data.

🚀 Getting Started

Follow these steps to set up and run the project locally.

1️⃣ Download the Dataset

Download the Movies Dataset in .csv format from Kaggle:

2️⃣ Organize the Data

After downloading the dataset:

Create a data/ folder in the root directory of this project.

Save the CSV file inside the data/ folder as movies.csv.

3️⃣ Run ChromaDB Locally

You can run ChromaDB locally using Docker:

docker run -d --rm --name chromadb -p 8000:8000 -v ./chroma:/chroma/chroma -e IS_PERSISTENT=TRUE -e ANONYMIZED_TELEMETRY=TRUE chromadb/chroma:0.6.3

Alternatively, you can install and run ChromaDB manually from its official documentation.

4️⃣ Run MongoDB Locally

If your project requires MongoDB, you can run it using Docker:

docker run -d -p 27017:27017 mongo

5️⃣ Set Up Environment Variables

Copy .env.example to .env:

cp .env.example .env

Open .env and fill in the necessary values.

6️⃣ Build the Project

Run TypeScript compiler to transpile the code:

tsc -b

7️⃣ Populate the Database

To load 100K movies into ChromaDB, run:

node dist/knowledge-base/movie-collection.js

This will process the movies dataset and store it in ChromaDB for efficient search and retrieval.

8️⃣ Install Dependencies

After setting up the database, install the required dependencies:

npm install

9️⃣ Start the CLI

Finally, start the CLI application using:

npm run start

Now, you can interact with the movie database using the command-line interface!

🎯 Notes

Ensure that ChromaDB and MongoDB are running before executing database-related commands.

The dataset is limited to 100,000 movies to load movies quickly performance.

The .env file should contain all required API keys, database URLs, and other necessary configurations.
