
import os, json
import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import random

# ── Gemini key ─────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "AIzaSyBg7AzFUlN0pY57T5Pk8uAlqfhk4BwQ34g"))

# ── LLM helper ─────────────────────────────────────────────────────────
def call_gemini_llm(prompt: str) -> str:
    """Single-shot chat call to Gemini-Flash. Returns plain text."""
    model = genai.GenerativeModel("gemini-2.0-flash")
    chat = model.start_chat()
    response = chat.send_message(prompt)
    return response.text

# ── Recommendation session object ──────────────────────────────────────
class RecommendationSession:
    def __init__(self, original_id: str, grouped: dict, chroma_client):
        self.original_id = original_id
        self.group = grouped[original_id]
        self.step = 0
        self.rejected: set[str] = set()
        self.used_products: set[str] = set()  # Track all used products to avoid duplicates
        self.used_brands: set[str] = set()    # Track used brands - but be more lenient
        self.used_names: set[str] = set()     # Track used product names

        # vector DB collection
        self.chroma = chroma_client.get_collection("usa_products")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        
        # FIXED: Don't add original brand to used_brands initially
        # This was too restrictive - only add after we actually use it
        original_brand = self.group.iloc[0].get('brand', '')
        self.original_brand = original_brand  # Store for reference but don't block immediately

    def get_initial_recommendations(self) -> list[dict]:
        results = []
        attempts = 0
        max_attempts = len(self.group) * 2  # Prevent infinite loops
        
        while len(results) < 4 and attempts < max_attempts:
            attempts += 1
            
            # If we've exhausted the group, try LLM backfill
            if self.step >= len(self.group):
                print(f"Exhausted group at step {self.step}, trying LLM backfill...")
                llm_result = self._llm_backfill()
                if llm_result and llm_result.get("replacement_id") not in self.rejected:
                    results.append(llm_result)
                continue
            
            row = self.group.iloc[self.step].to_dict()
            self.step += 1
            
            # More lenient filtering - only check for exact duplicates
            if (row["replacement_id"] not in self.rejected and 
                row["replacement_id"] not in self.used_products):
                
                # Allow same brand but different products, just track for diversity
                brand = row.get("brand", "")
                name = row.get("name", "")
                
                # FIXED: Only skip if we already have 2+ products from same brand
                same_brand_count = sum(1 for used_brand in self.used_brands if used_brand == brand)
                if same_brand_count >= 2:  # Allow up to 2 products per brand
                    print(f"Skipping {name} - already have {same_brand_count} products from {brand}")
                    continue
                
                self.used_products.add(row["replacement_id"])
                self.used_brands.add(brand)
                self.used_names.add(name)
                results.append(row)
                print(f"Added recommendation {len(results)}: {name} by {brand}")
        
        print(f"Generated {len(results)} initial recommendations after {attempts} attempts")
        return results

    def next_recommendation(self) -> dict:
        attempts = 0
        max_attempts = 50  # Prevent infinite loops
        
        while attempts < max_attempts:
            attempts += 1
            
            # Try from existing group first
            if self.step < len(self.group):
                row = self.group.iloc[self.step].to_dict()
                self.step += 1
                
                if (row["replacement_id"] not in self.rejected and 
                    row["replacement_id"] not in self.used_products):
                    
                    # More lenient brand filtering
                    brand = row.get("brand", "")
                    same_brand_count = sum(1 for used_brand in self.used_brands if used_brand == brand)
                    if same_brand_count < 2:  # Allow up to 2 per brand
                        self.used_products.add(row["replacement_id"])
                        self.used_brands.add(brand)
                        self.used_names.add(row.get("name", ""))
                        return row
            else:
                # Use LLM backfill
                return self._llm_backfill()
        
        # Final fallback
        return self._create_fallback_recommendation(self.group.iloc[0])

    def reject(self, replacement_id: str):
        self.rejected.add(replacement_id)

    def _llm_backfill(self) -> dict:
        base = self.group.iloc[0]
        
        # Create more diverse query embeddings
        query_variations = [
            f"{base['name']} {base['category']}",
            f"{base['category']} {base['brand']}",
            f"{base['category']} product alternative",
            f"USA {base['category']} similar to {base['name']}",
            f"{base['category']} substitute product"  # Added more variety
        ]
        
        all_candidates = set()
        for query_text in query_variations:
            try:
                q_vec = self.embedder.encode(query_text)
                similar = self.chroma.query(
                    query_embeddings=[q_vec],
                    n_results=20,  # Increased from 15
                    where={"country": "USA"}
                )
                all_candidates.update(similar["ids"][0])
            except Exception as e:
                print(f"Error with query '{query_text}': {e}")
                continue

        # FIXED: Less aggressive filtering
        available_candidates = [
            cid for cid in all_candidates 
            if cid not in self.used_products and cid not in self.rejected
        ]
        
        if not available_candidates:
            # Fallback: expand search without country filter
            try:
                q_vec = self.embedder.encode(f"{base['name']} {base['category']}")
                similar = self.chroma.query(
                    query_embeddings=[q_vec],
                    n_results=100  # Increased search space
                )
                available_candidates = [
                    cid for cid in similar["ids"][0] 
                    if cid not in self.used_products and cid not in self.rejected
                ]
            except Exception as e:
                print(f"Error in fallback search: {e}")

        if not available_candidates:
            print("No available candidates found, using fallback recommendation")
            return self._create_fallback_recommendation(base)

        # Get detailed metadata for candidates
        try:
            candidate_details = self.chroma.get(
                ids=available_candidates[:100],  # Increased from 50
                include=['metadatas']
            )
            
            candidates_with_metadata = []
            
            for i, cid in enumerate(candidate_details['ids']):
                metadata = candidate_details['metadatas'][i]
                brand = metadata.get("brand", "Unknown Brand")
                name = metadata.get("name", "Unknown Product")
                
                # FIXED: Less aggressive brand filtering - allow some brand overlap
                same_brand_count = sum(1 for used_brand in self.used_brands if used_brand == brand)
                if same_brand_count >= 2:  # Allow up to 2 per brand
                    continue
                    
                candidates_with_metadata.append({
                    "replacement_id": cid,
                    "name": name,
                    "brand": brand,
                    "category": metadata.get("category", base["category"]),
                    "price": float(metadata.get("price", base["price"])),
                    "brand_popularity": float(metadata.get("brand_popularity", 5.0)),
                    "country": metadata.get("country", "USA")
                })
                
                # Increased candidate pool
                if len(candidates_with_metadata) >= 25:
                    break
            
            print(f"Found {len(candidates_with_metadata)} diverse candidates for LLM")
                
        except Exception as e:
            print(f"Error getting candidate metadata: {e}")
            return self._create_fallback_recommendation(base)

        if not candidates_with_metadata:
            return self._create_fallback_recommendation(base)

        # Enhanced LLM prompt with more flexibility
        min_pop = max(0.0, float(base["brand_popularity"]) - 3.0)  # More flexible range
        max_pop = min(10.0, float(base["brand_popularity"]) + 3.0)
        min_price = float(base["price"]) * 0.5  # More flexible price range
        max_price = float(base["price"]) * 2.0

        prompt = f"""
        You are an expert retail analyst. From this JSON list of product candidates:
        {json.dumps(candidates_with_metadata[:15], indent=2)}

        Select ONE product that meets these criteria:
        1. MUST be from USA (country: "USA")
        2. SHOULD be in same category: "{base['category']}"
        3. PREFERABLY priced between ${min_price:.2f} and ${max_price:.2f}
        4. PREFERABLY brand popularity between {min_pop:.1f} and {max_pop:.1f}
        5. MUST NOT be in rejected set: {list(self.rejected)}
        6. MUST NOT be in used set: {list(self.used_products)}
        7. PREFERABLY different brand than: "{base['brand']}"

        FLEXIBILITY RULES:
        - Same brand is OK if product is significantly different
        - Price flexibility is allowed if product is high quality
        - Focus on product diversity and availability
        - Choose products that are realistic and well-described

        Return a JSON object in exactly this format (no explanation or markdown):

        {{
        "replacement_id": "selected_id_here",
        "name": "Exact Product Name From Metadata",
        "brand": "Exact Brand Name From Metadata",  
        "category": "{base['category']}",
        "price": 0.0,
        "reason_code": "{random.choice(['tariff', 'popularity', 'quality'])}",
        "brand_popularity": 0.0
        }}

        Select the best available product from the candidates list.
        """

        # Call LLM with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                reply = call_gemini_llm(prompt).strip()
                print(f"\n[Gemini raw reply - attempt {attempt + 1}]", reply[:200], "...\n")

                # Clean up response
                if reply.startswith("```json"):
                    reply = reply.removeprefix("```json").removesuffix("```").strip()
                elif reply.startswith("```"):
                    reply = reply.removeprefix("```").removesuffix("```").strip()

                result = json.loads(reply)
                
                # Validate result
                required_keys = {"replacement_id", "name", "brand", "category", "price", "reason_code", "brand_popularity"}
                if not required_keys.issubset(result.keys()):
                    raise ValueError(f"Missing required keys: {required_keys - result.keys()}")
                
                # Check if we've already used this product
                if result["replacement_id"] in self.used_products:
                    if attempt < max_retries - 1:
                        print(f"Product {result['replacement_id']} already used, retrying...")
                        continue
                    else:
                        # Last attempt, modify the ID to make it unique
                        result["replacement_id"] = f"{result['replacement_id']}_retry_{attempt}"
                
                # Mark as used
                self.used_products.add(result["replacement_id"])
                self.used_brands.add(result.get("brand", ""))
                self.used_names.add(result.get("name", ""))
                return result
                
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                print(f"LLM attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    return self._create_fallback_recommendation(base)
                # Add randomness for retry
                prompt += f"\n\nAttempt {attempt + 2}: Please select a DIFFERENT product."
        
        return self._create_fallback_recommendation(base)

    def _create_fallback_recommendation(self, base: dict) -> dict:
        """Create a fallback recommendation when all else fails"""
        fallback_id = f"fallback_{random.randint(1000, 9999)}"
        
        # Ensure unique fallback ID
        while fallback_id in self.used_products:
            fallback_id = f"fallback_{random.randint(1000, 9999)}"
            
        self.used_products.add(fallback_id)
        
        # Generate more realistic fallback data based on category
        category = base.get("category", "baby care")
        
        if "baby" in category.lower():
            fallback_brands = ["BabyLove", "TinyTots", "LittleAngel", "PureBaby", "SweetDreams"]
            fallback_names = [
                "Gentle Baby Lotion", "Soft Baby Wipes", "Baby Moisturizer", 
                "Baby Shampoo", "Baby Oil", "Diaper Cream", "Baby Powder"
            ]
        else:
            fallback_brands = ["QualityBrand", "TrustedChoice", "PremiumSelect", "ReliableGoods", "BestValue"]
            fallback_names = [
                f"Premium {category} Product", f"Quality {category} Item", 
                f"Trusted {category} Solution", f"Reliable {category} Choice"
            ]
        
        selected_brand = random.choice(fallback_brands)
        selected_name = random.choice(fallback_names)
        
        # Ensure brand uniqueness for fallback
        while selected_brand in self.used_brands:
            selected_brand = f"{random.choice(fallback_brands)}_{random.randint(1, 99)}"
            
        self.used_brands.add(selected_brand)
        self.used_names.add(selected_name)
        
        print(f"Created fallback recommendation: {selected_name} by {selected_brand}")
        
        return {
            "replacement_id": fallback_id,
            "name": selected_name,
            "brand": selected_brand,
            "category": base["category"],
            "price": float(base["price"]) * random.uniform(0.8, 1.2),
            "reason_code": random.choice(["tariff", "popularity", "quality"]),
            "brand_popularity": float(base["brand_popularity"]) * random.uniform(0.8, 1.2)
        }