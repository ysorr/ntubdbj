import pandas as pd
import json
import os
import re
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_source_dir = os.path.join(script_dir, "..", "Normalization")
output_json_file = os.path.join(script_dir, "dbms.json")
#定義要處理的 CSV 檔案，以及它們在 Firebase 節點名稱
file_to_node_map = {
    "師資等級查詢.csv": "teacherlevel",
    "教授任教專長.csv": "teacherskill",
    "學校專長定位.csv": "school"
}
#定義每個 CSV 檔案要使用的主 Key 欄位
file_to_key_column = {
    "師資等級查詢.csv": "教師名稱",  
    "教授任教專長.csv": "教師名稱", 
    "學校專長定位.csv": "學校名稱"  
}
# 這是最終要匯出成 JSON 的資料
all_firebase_data = {}
def sanitize_firebase_key(key_string):
    """
    清理字串，使其可用作 Firebase Realtime Database 的 Key。
    移除 . $ # [ ] /
    """
    if not isinstance(key_string, str):
        key_string = str(key_string)
    # 使用 re.sub 來替換所有不允許的字元
    return re.sub(r'[.$#\[\]/]', '_', key_string)

def process_group(group_df, key_column):
    """
    處理 groupby 後的每個分組。
    如果分組只有一筆資料，返回該筆資料的 dict。
    如果有多筆資料，返回 dict 的 list。
    """
    # 移除當作 Key 的那個欄位，因為它已經在上一層了
    records = group_df.drop(columns=[key_column]).to_dict('records')
    
    if len(records) == 1:
        return records[0]
    else:
        return records

# --- 主要程式邏輯 ---

print("--- 開始將多個 CSV 轉換為 Firebase JSON (使用指定主Key) ---")

try:
    # 遍歷設定中的每個檔案
    for csv_filename, node_name in file_to_node_map.items():
        # 組合 CSV 檔案的完整路徑
        input_csv_file = os.path.join(csv_source_dir, csv_filename)
        
        # 根據檔名，從字典中獲取對應的主 Key 欄位
        key_column = file_to_key_column.get(csv_filename)
        if not key_column:
            print(f"\n[警告] 找不到 '{csv_filename}' 的主 Key 設定，將跳過此檔案。")
            continue
        print(f"\n[處理中] 正在讀取: '{input_csv_file}'...")

        # 1. 讀取 CSV 檔案
        df = pd.read_csv(input_csv_file, encoding='utf-8-sig')
        # 2. 處理 NaN (轉為 None)
        df = df.where(pd.notna(df), None)
        # 檢查主 Key 欄位是否存在
        if key_column not in df.columns:
            print(f"          [錯誤] CSV 檔案中找不到主 Key 欄位 '{key_column}'！")
            continue
            
        # 檢查主 Key 欄位中是否有空值
        if df[key_column].isna().any():
            print(f"          [警告] 主 Key 欄位 '{key_column}' 中有空值，將過濾掉這些紀錄。")
            df = df.dropna(subset=[key_column])

        print(f"          ...讀取完畢。將使用 '{key_column}' 作為主 Key 進行分組。")

        # 清理主 Key 欄位 (移除 Firebase 不允許的字元)
        df[key_column] = df[key_column].apply(sanitize_firebase_key)

        # 使用 *動態取得* 的 'key_column' 進行分組
        data_dict = df.groupby(key_column).apply(
            process_group, 
            key_column=key_column
        ).to_dict()
        
        # 將處理好的字典存入最終的資料結構
        all_firebase_data[node_name] = data_dict
        
        print(f"[成功] '{node_name}' 節點已準備好 {len(data_dict)} 個主 Key。")

    # 有資料處理完畢寫入 JSON 檔案
    if not all_firebase_data:
        print("\n[錯誤] 沒有任何資料被成功處理，請檢查 CSV 檔案和設定。")
    else:
        print(f"\n--- 所有資料處理完畢，正在寫入 JSON 檔案 ---")
        
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(all_firebase_data, f, ensure_ascii=False, indent=2)
                
        print(f"\n成功！已將適用於 Firebase 的 JSON 資料儲存至:")
        print(f"{output_json_file}")

except FileNotFoundError as e:
    print(f"\n[錯誤] 找不到輸入檔案！")
    print(f"詳細資訊: {e}")
    print(f"請確認 '.py' 檔案的上一層目錄中存在 'Normalization' 資料夾,")
    print(f"並且該資料夾包含以下所有檔案:")
    for csv_filename in file_to_node_map.keys():
        print(f" - {csv_filename}")
        
except Exception as e:
    print(f"\n處理過程中發生未預期的錯誤: {e}")