import pandas as pd
# 設定檔案名稱跟路徑
input_filename = '../Normalization/學校專長定位.csv' 
output_filename = '學校專長定位_去除重複資料.csv'
try:
    # 讀取 CSV 檔案
    df = pd.read_csv(input_filename)
    
    # 記錄原始資料筆數
    original_rows = len(df)
    # 移除重複的資料行drop_duplicates() 會保留第一筆出現的資料，並刪除後面所有相同的資料
    df_cleaned = df.drop_duplicates()
    # 記錄處理後的資料筆數
    cleaned_rows = len(df_cleaned)
    removed_rows = original_rows - cleaned_rows
    # index=False 表示儲存時不要包含 pandas 的索引 (0, 1, 2...)  encoding='utf-8-sig' 確保不會亂碼
    df_cleaned.to_csv(output_filename, index=False, encoding='utf-8-sig')
    
except FileNotFoundError:
    pass 

except Exception as e:
    pass