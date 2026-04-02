import pandas as pd
import numpy as np

def generate_product_weather_impact_dataset(student_index=1, random_seed=None):
    """
    Generate a dataset showing how weather factors influence 3 products.
    """

    # Set random seed for reproducibility
    if random_seed is not None:
        np.random.seed(random_seed + student_index)

    # Products (rows)
    products = ['Product_A_Winter_Jacket', 'Product_B_Rain_Boots', 'Product_C_Sunglasses']

    # Base impact trend for each weather factor (product sensitivity)
    base_impact = {
        'tavg': [0.2, 0.4, 0.9],   # avg temperature
        'tmin': [0.3, 0.5, 0.8],   # min temperature
        'tmax': [0.4, 0.5, 0.9],   # max temperature
        'prcp': [0.7, 0.9, 0.2],   # rainfall
        'snow': [0.9, 0.5, 0.1],   # snow
        'wspd': [0.5, 0.6, 0.3],   # wind speed
        'tsun': [0.3, 0.4, 0.9],   # sunshine
        'pres': [0.5, 0.5, 0.5]    # pressure (neutral)
    }

    # Add random noise to each value
    df_raw = pd.DataFrame({
        'product': products,
        'tavg': np.clip(np.array(base_impact['tavg']) + np.random.normal(0, 0.1, 3), 0, 1),
        'tmin': np.clip(np.array(base_impact['tmin']) + np.random.normal(0, 0.1, 3), 0, 1),
        'tmax': np.clip(np.array(base_impact['tmax']) + np.random.normal(0, 0.1, 3), 0, 1),
        'prcp': np.clip(np.array(base_impact['prcp']) + np.random.normal(0, 0.1, 3), 0, 1),
        'snow': np.clip(np.array(base_impact['snow']) + np.random.normal(0, 0.1, 3), 0, 1),
        'wspd': np.clip(np.array(base_impact['wspd']) + np.random.normal(0, 0.1, 3), 0, 1),
        'tsun': np.clip(np.array(base_impact['tsun']) + np.random.normal(0, 0.1, 3), 0, 1),
        'pres': np.clip(np.array(base_impact['pres']) + np.random.normal(0, 0.1, 3), 0, 1)
    })

    # Normalize 0–1 for radar chart comparison
    numeric_cols = ['tavg','tmin','tmax','prcp','snow','wspd','tsun','pres']
    df_norm = df_raw.copy()
    for col in numeric_cols:
        min_val = df_raw[col].min()
        max_val = df_raw[col].max()
        range_val = max_val - min_val if max_val != min_val else 1
        df_norm[col] = ((df_raw[col] - min_val)/range_val).round(3)

    # Save datasets {you can provide your own path if not save in the root folder }
    df_raw.to_csv(f"1/student{student_index}_product_weather_raw.csv", index=False)
    df_norm.to_csv(f"1/student{student_index}_product_weather_normalized.csv", index=False)

    return df_raw, df_norm







# ------------------------------------------------


student_index = 24880019     # You can set your own index number
random_seed = 100   # You can set your own random seed


# ------------------------------------------------





df_raw, df_norm = generate_product_weather_impact_dataset(student_index, random_seed)

print("Raw dataset:")
print(df_raw)
print("\nNormalized dataset:")
print(df_norm)
