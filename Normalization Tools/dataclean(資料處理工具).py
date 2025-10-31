import pandas as pd
import os
input_filename = os.path.join('..', 'opendatacsv', '113學年度大專校院教師學術專長彙整表.csv') #原始 CSV 檔案名稱
output_filename = '專長.csv' #儲存的、整理過的新檔案名稱
# 我們要留的欄位名稱
columns_to_keep = [
    '教師專長',
]
def process_csv(input_file, output_file, keep_cols):
    """
    讀取 CSV 檔案，只保留指定的欄位，並儲存為新檔案。
    """
    # 檢查檔案是否存在
    if not os.path.exists(input_file):
        return
    try:
        df = pd.read_csv(input_file)
        # 偵測並修正貼上的標頭 '代碼"' (多一個引號)
        if '代碼' not in df.columns and '代碼"' in df.columns:
            df.rename(columns={'代碼"': '代碼'}, inplace=True)   
        # 檢查所有要保留的欄位是否存在
        missing_cols = [col for col in keep_cols if col not in df.columns]
        if missing_cols:
            return
        cleaned_df = df[keep_cols] # 篩選出想要的欄位
        cleaned_df.to_csv(output_file, index=False, encoding='utf-8-sig') # 將整理後的資料存CSV（encoding='utf-8-sig' 可以確保不會亂碼）
        print(f"✅ 成功！已將資料儲存至 {output_file}")
    except pd.errors.EmptyDataError:
        pass 
    except Exception as e:
        pass 
if __name__ == "__main__":
    process_csv(input_filename, output_filename, columns_to_keep)