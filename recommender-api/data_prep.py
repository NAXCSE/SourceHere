# data_prep.py
import pandas as pd

def load_candidate_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # quick sanity: enforce lower-case cols & dtypes we’ll query
    df.columns = [c.lower() for c in df.columns]
    return df

def group_by_original(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    return {k: g.reset_index(drop=True) for k, g in df.groupby("original_product_id")}
