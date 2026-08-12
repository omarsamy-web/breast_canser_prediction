import pandas as pd
import numpy as np

df = pd.read_csv(r"D:\DOWNLOADS\breast canser project\breast_cancer_40_features_1M.csv")

df = df.iloc[:20000]


df.to_csv("breast_cancer_edited.csv", index=False)

print("CSV saved successfully")