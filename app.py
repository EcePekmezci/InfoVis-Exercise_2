from flask import Flask, render_template
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer

app = Flask(__name__)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Brazil', 'Bulgaria', 'Cameroon',
    'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Ecuador', 'Egypt, Arab Rep.', 'Eritrea', 'Ethiopia',
    'France', 'Germany', 'Ghana', 'Greece', 'India', 'Indonesia',
    'Iran, Islamic Rep.', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Lebanon', 'Malta', 'Mexico', 'Morocco',
    'Pakistan', 'Peru', 'Philippines', 'Russian Federation',
    'Syrian Arab Republic', 'Tunisia', 'Turkey', 'Ukraine'
]

@app.route('/')
def index():
    df = pd.read_csv("static/data/output.csv", sep=";")

    # Filter to only required countries
    df = df[df["Country Name"].isin(COUNTRIES)]

    # Clean NaN and Infinity
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)

    # --- Task 2: PCA on most recent year ---
    most_recent_year = df["year"].max()
    df_recent = df[df["year"] == most_recent_year].copy()
    df_recent = df_recent.set_index("Country Name")

    # Drop non-feature columns
    skip_cols = ["year", "Country Code"]
    feature_cols = [c for c in df_recent.columns if c not in skip_cols]
    df_features = df_recent[feature_cols]

    # Drop columns with >50% missing, impute rest
    df_features = df_features.dropna(axis=1, thresh=len(df_features) * 0.5)
    imputer = SimpleImputer(strategy="mean")
    X_imputed = imputer.fit_transform(df_features)

    # Scale + PCA
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    pca = PCA(n_components=2)
    coords = pca.fit_transform(X_scaled)
    explained = pca.explained_variance_ratio_

    # Build PCA result
    pca_data = [
        {
            "country": country,
            "pc1": float(coords[i, 0]),
            "pc2": float(coords[i, 1])
        }
        for i, country in enumerate(df_features.index)
    ]

    # Full data for map + line chart
    all_data = df.to_dict(orient="records")

    return render_template("index.html",
                           data=json.dumps(all_data),
                           pca_data=json.dumps(pca_data),
                           explained=json.dumps(explained.tolist()))

if __name__ == '__main__':
    app.run(debug=True)