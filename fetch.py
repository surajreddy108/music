import pandas as pd
import requests
from io import BytesIO

def fetch_prabhupada_data_from_github():
    """
    Fetch Excel data directly from GitHub repository
    """
    # Replace with your actual GitHub URL
    github_raw_url = "https://github.com/yourusername/prabhupada-vani/raw/main/Srila%20Prabhupad%20Vani.xlsx"
    
    try:
        # Download the Excel file
        print(f"Downloading from GitHub: {github_raw_url}")
        response = requests.get(github_raw_url)
        response.raise_for_status()  # Raise error for bad status codes
        
        # Read Excel file into pandas DataFrame
        print("Loading Excel data...")
        excel_data = pd.read_excel(
            BytesIO(response.content),
            sheet_name='Prabhupadvani'  # or use sheet index: sheet_name=0
        )
        
        print(f"Successfully loaded {len(excel_data)} records")
        print(f"Columns: {list(excel_data.columns)}")
        
        return excel_data
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")
        return None
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Fetch the data
    data = fetch_prabhupada_data_from_github()
    
    if data is not None:
        # Display first few rows
        print("\nFirst 5 rows:")
        print(data.head())
        
        # Basic statistics
        print(f"\nTotal lectures: {len(data)}")
        print(f"Date range: {data['date'].min()} to {data['date'].max()}")
        
        # Count by location
        print("\nLectures by location:")
        print(data['location'].value_counts().head(10))
