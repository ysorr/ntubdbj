import pandas as pd
import numpy as np
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
#設定模型，我們採用的是 paraphrase 模型
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'
SIMILARITY_THRESHOLD = 0.5
#路徑
professor_file_path = os.path.join("..", "Normalization", "授任教專長.csv")
expertise_file_path = os.path.join("..", "向量處理資料夾", "向量標準.csv")
output_filename = "向量正規化教授任教專長.csv"
#載入模型 ---
model = SentenceTransformer(MODEL_NAME, device='mps')
# 讀取並準備資料 ---
try:
    df_professors = pd.read_csv(professor_file_path)
    df_expertise = pd.read_csv(expertise_file_path)
    valid_expertise_list = df_expertise['專長分類'].dropna().unique().tolist()
    print(f"成功讀取 {len(df_professors)} 筆教授資料與 {len(valid_expertise_list)} 個標準分類。")
except FileNotFoundError:
    pass
    exit()
except Exception:
    pass
    exit()

#執行向量化

#將 "標準專長" 向量化
corpus_embeddings = model.encode(
    valid_expertise_list, 
    show_progress_bar=True,
    batch_size=128 
)
print("標準專長向量化完成。")

#將 "教授專長" 向量化
professor_expertise_list = df_professors['教師專長'].fillna("").astype(str).tolist()

query_embeddings = model.encode(
    professor_expertise_list, 
    show_progress_bar=True,
    batch_size=128
)
print("教授專長向量化完成。")
#計算相似度並找出最佳匹配
print("正在計算相似度矩陣...")
# 使用 scikit-learn 進行超高速的矩陣運算
cos_scores_matrix = cosine_similarity(query_embeddings, corpus_embeddings)
best_match_indices = np.argmax(cos_scores_matrix, axis=1)
best_match_scores = np.max(cos_scores_matrix, axis=1)
print("計算完成，正在整理結果...")
#整理結果 ---
results = []
for i in range(len(professor_expertise_list)):
    raw_text = professor_expertise_list[i]
    best_score = best_match_scores[i]
    best_index = best_match_indices[i]
    # 如果原始資料為空，或分數低於門檻，則 "無法分類"
    if not raw_text.strip() or best_score < SIMILARITY_THRESHOLD:
        results.append("無法分類")
    else:
        results.append(valid_expertise_list[best_index])
df_professors['向量正規化教授任教專長'] = results
print(f"\n--- 處理完成！總共 {len(df_professors)} 筆資料。 ---")
#儲存
try:
    df_professors.to_csv(output_filename, index=False, encoding='utf-8-sig')
    print(f"所有資料已成功儲存至: {output_filename}")
except Exception:
    pass