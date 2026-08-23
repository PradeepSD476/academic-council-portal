import pandas as pd
import numpy as np
import math
from k_means_constrained import KMeansConstrained
from scipy.optimize import linear_sum_assignment
from scipy.spatial.distance import cdist

def cluster_juniors(X_juniors, df_juniors, min_size, max_size):
    num_students = len(df_juniors)
    
    if num_students == 0:
        return df_juniors, pd.DataFrame()

    # Calculate optimal number of clusters (K) to stay within 3 to 5 range
    K_min = math.ceil(num_students / max_size)
    K_max = math.floor(num_students / min_size)
    
    if K_min > K_max or num_students < min_size:
        # Fallback if mathematically impossible (e.g. only 7 students left over)
        target_size = (min_size + max_size) / 2
        K = max(1, round(num_students / target_size))
        actual_min = min(min_size, num_students // K)
        actual_max = max(max_size, math.ceil(num_students / K))
    else:
        # Pick K that gets average group size as close to 4 as possible
        target_size = (min_size + max_size) / 2
        target_K = round(num_students / target_size)
        K = max(K_min, min(target_K, K_max))
        actual_min, actual_max = min_size, max_size

    print(f"Engine generating {K} clusters. Limits enforced: [{actual_min} - {actual_max}] mentees per group.")

    df_juniors = df_juniors.copy()
    if K == 1 or num_students <= min_size:
        df_juniors['cluster_id'] = 0
        if not X_juniors.empty:
            mean_vals = X_juniors.values.mean(axis=0, keepdims=True)
            centroids = pd.DataFrame(mean_vals, columns=X_juniors.columns)
        else:
            centroids = pd.DataFrame()
        return df_juniors, centroids

    clf = KMeansConstrained(
        n_clusters=K,
        size_min=actual_min,
        size_max=actual_max,
        random_state=42
    )
    
    df_juniors['cluster_id'] = clf.fit_predict(X_juniors.values)
    
    centroids = pd.DataFrame(clf.cluster_centers_, columns=X_juniors.columns)
    return df_juniors, centroids

def assign_seniors_flexible(X_seniors, df_seniors, centroids, min_per_cluster, max_per_cluster):
    df_seniors = df_seniors.copy()
    df_seniors['assigned_cluster_id'] = -1
    
    if df_seniors.empty or centroids.empty:
        return df_seniors
        
    # Align columns between seniors and mentee centroids
    missing_cols = set(centroids.columns) - set(X_seniors.columns)
    for c in missing_cols:
        X_seniors[c] = 0
    X_seniors = X_seniors[centroids.columns]
    
    X_vals = X_seniors.values
    C_vals = centroids.values
    unassigned_indices = list(range(len(df_seniors)))
    
    # PASS 1: Fulfill the mandatory minimum (e.g., ensure every group gets 2 co-mentors)
    if min_per_cluster > 0 and len(unassigned_indices) > 0:
        dist_matrix = cdist(X_vals, C_vals, metric="euclidean")
        extended_dist_matrix = np.repeat(dist_matrix, min_per_cluster, axis=1)
        
        row_ind, col_ind = linear_sum_assignment(extended_dist_matrix)
        
        assigned_clusters = col_ind // min_per_cluster
        for r, c in zip(row_ind, assigned_clusters):
            df_seniors.iloc[r, df_seniors.columns.get_loc('assigned_cluster_id')] = c
            if r in unassigned_indices:
                unassigned_indices.remove(r)
                
    # PASS 2: Distribute leftovers up to the max limit (e.g., the 3rd co-mentor)
    if max_per_cluster > min_per_cluster and len(unassigned_indices) > 0:
        X_rem = X_vals[unassigned_indices]
        dist_matrix_rem = cdist(X_rem, C_vals, metric="euclidean")
        
        optional_slots = max_per_cluster - min_per_cluster
        extended_dist_matrix_rem = np.repeat(dist_matrix_rem, optional_slots, axis=1)
        
        row_ind_rem, col_ind_rem = linear_sum_assignment(extended_dist_matrix_rem)
        
        assigned_clusters_rem = col_ind_rem // optional_slots
        for r_rem, c in zip(row_ind_rem, assigned_clusters_rem):
            actual_r = unassigned_indices[r_rem]
            df_seniors.iloc[actual_r, df_seniors.columns.get_loc('assigned_cluster_id')] = c
            
    return df_seniors

def assign_mentors_to_groups(X_mentors, df_mentors, centroids, max_groups_per_mentor=2):
    df_mentors = df_mentors.copy()
    
    # We will track which groups each mentor is assigned to.
    # Stored as a list of group IDs (or cluster IDs) in a new column.
    df_mentors['assigned_cluster_ids'] = [[] for _ in range(len(df_mentors))]
    
    if df_mentors.empty or centroids.empty:
        return df_mentors
        
    # Align columns between seniors and mentee centroids
    missing_cols = set(centroids.columns) - set(X_mentors.columns)
    for c in missing_cols:
        X_mentors[c] = 0
    X_mentors = X_mentors[centroids.columns]
    
    X_vals = X_mentors.values
    C_vals = centroids.values
    
    num_groups = len(centroids)
    num_mentors = len(df_mentors)
    
    # Calculate pairwise distances
    dist_matrix = cdist(C_vals, X_vals, metric="euclidean")
    
    # We want to assign exactly 1 mentor per group. 
    # Since mentors can manage up to max_groups_per_mentor groups, we duplicate the mentor nodes.
    # Dist_matrix: Rows = Groups, Cols = Mentors
    extended_dist_matrix = np.repeat(dist_matrix, max_groups_per_mentor, axis=1)
    
    row_ind, col_ind = linear_sum_assignment(extended_dist_matrix)
    
    # col_ind corresponds to the duplicated mentor indices
    assigned_mentors_raw = col_ind // max_groups_per_mentor
    
    for cluster_id, mentor_idx in zip(row_ind, assigned_mentors_raw):
        df_mentors.at[df_mentors.index[mentor_idx], 'assigned_cluster_ids'].append(cluster_id)
        
    return df_mentors