import pandas as pd
from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler

def preprocess_questionnaire_data(df, weights):
    """
    Takes a DataFrame of questionnaire responses and applies one-hot/multi-hot encoding
    based on the provided weights configuration.
    """
    if df.empty:
        return pd.DataFrame()

    encoded_dfs = []

    # 1. Multi-Hot Encode Array Fields (Languages, Tech Interests, etc.)
    multi_cols = ["languages", "techInterests", "sportsInterests", "cultInterests", "hobbies"]
    for col in multi_cols:
        if col in df.columns:
            mlb = MultiLabelBinarizer()
            # Ensure we are dealing with lists
            lists = df[col].apply(lambda x: x if isinstance(x, list) else [])
            if not lists.empty:
                arr = mlb.fit_transform(lists)
                col_names = [f"{col}_{c}" for c in mlb.classes_]
                encoded = pd.DataFrame(arr, columns=col_names, index=df.index)
                
                # Apply weight if defined in config
                weight = weights.get(col, 1)
                encoded = encoded * weight
                encoded_dfs.append(encoded)

    # 2. One-Hot Encode Single Choice Fields (Branch, Preference)
    single_cols = ["branch", "preference"]
    for col in single_cols:
        if col in df.columns:
            encoded = pd.get_dummies(df[col], prefix=col)
            weight = weights.get(col, 1)
            encoded = encoded * weight
            encoded_dfs.append(encoded)

    # Combine all engineered features
    if encoded_dfs:
        X = pd.concat(encoded_dfs, axis=1).fillna(0)
    else:
        X = pd.DataFrame(index=df.index)

    return X