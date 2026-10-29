
import pandas as pd

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# Load data
df = pd.read_csv("data.csv")

X = df.drop(columns=["Revenue"])
y = df["Revenue"].astype(bool)

# These numeric columns represent categories
categorical_features = [
    "Month",
    "OperatingSystems",
    "Browser",
    "Region",
    "TrafficType",
    "VisitorType",
    "Weekend",
]

numerical_features = [
    col for col in X.columns
    if col not in categorical_features
]

# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features,
        ),
        ("numerical", "passthrough", numerical_features),
    ]
)

# Split once; keep test data separate from tuning
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", DecisionTreeClassifier(random_state=42)),
])

# Hyperparameter search
param_grid = {
    "classifier__max_depth": [4, 6, 8, 10, None],
    "classifier__min_samples_leaf": [5, 10, 20],
    "classifier__min_samples_split": [2, 10],
    "classifier__class_weight": [None, "balanced"],
}

search = GridSearchCV(
    estimator=pipeline,
    param_grid=param_grid,
    scoring="f1",
    cv=5,
    n_jobs=-1,
    verbose=1,
)

search.fit(X_train, y_train)

best_model = search.best_estimator_
y_pred = best_model.predict(X_test)

print("\nBest parameters:")
print(search.best_params_)

print("\nBest cross-validation F1:", round(search.best_score_, 4))

print("\nTest accuracy:", round(accuracy_score(y_test, y_pred), 4))
print("Test precision:", round(precision_score(y_test, y_pred, zero_division=0), 4))
print("Test recall:", round(recall_score(y_test, y_pred, zero_division=0), 4))
print("Test F1-score:", round(f1_score(y_test, y_pred, zero_division=0), 4))

print("\nClassification report:")
print(classification_report(y_test, y_pred, zero_division=0))

print("Confusion matrix:")
print(confusion_matrix(y_test, y_pred))
