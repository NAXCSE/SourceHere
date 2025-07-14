
from sentence_transformers import SentenceTransformer
import chromadb, pandas as pd

model = SentenceTransformer("all-MiniLM-L6-v2")

def build_index(df_repl: pd.DataFrame,
                persist_dir="chroma/usa_products"):
    chroma = chromadb.PersistentClient(persist_dir)
    
    # Delete existing collection to rebuild with correct metadata
    try:
        chroma.delete_collection("usa_products")
        print("Deleted existing collection")
    except:
        pass
    
    coll = chroma.create_collection("usa_products")

    # ▸ guarantee a 'country' field = 'USA'
    df_repl = df_repl.copy()
    if "country" not in df_repl.columns:
        df_repl["country"] = "USA"

    # Ensure all required columns exist with proper data types
    required_columns = ["name", "brand", "category", "price", "brand_popularity", "country"]
    for col in required_columns:
        if col not in df_repl.columns:
            if col == "brand_popularity":
                df_repl[col] = 5.0  # Default value
            else:
                df_repl[col] = "Unknown"
    
    # Convert price and brand_popularity to proper numeric types
    df_repl["price"] = pd.to_numeric(df_repl["price"], errors='coerce').fillna(0.0)
    df_repl["brand_popularity"] = pd.to_numeric(df_repl["brand_popularity"], errors='coerce').fillna(5.0)
    
    # Fill any NaN values in text columns
    text_columns = ["name", "brand", "category", "country"]
    for col in text_columns:
        df_repl[col] = df_repl[col].fillna("Unknown").astype(str)
    
    # Debug: Print column info
    print("DataFrame columns:", df_repl.columns.tolist())
    print("DataFrame shape:", df_repl.shape)
    print("Sample metadata:")
    print(df_repl[required_columns].head(3))
    
    texts = (df_repl["name"] + " " + df_repl["category"]).tolist()
    embeds = model.encode(texts, show_progress_bar=True)

    # Convert to metadata format that ChromaDB expects
    metadata_records = []
    for _, row in df_repl.iterrows():
        metadata_records.append({
            "name": str(row["name"]),
            "brand": str(row["brand"]),
            "category": str(row["category"]),
            "price": float(row["price"]),
            "brand_popularity": float(row["brand_popularity"]),
            "country": str(row["country"])
        })

    print(f"Adding {len(metadata_records)} records to ChromaDB...")
    print("Sample metadata record:", metadata_records[0])

    coll.add(
        ids=df_repl["replacement_id"].tolist(),
        embeddings=embeds,
        metadatas=metadata_records
    )
    
    print("Successfully built vector database!")

if __name__ == "__main__":
    df = pd.read_csv("C:/Users/kumar/Desktop/project/src/data/replacements.csv")
    
    # Debug: Check what columns exist in your CSV
    print("Original CSV columns:", df.columns.tolist())
    print("Sample rows:")
    print(df.head(3))
    
    build_index(df)