UPDATE work_items SET sort_order = -1 WHERE project_id = 1 AND id NOT IN (
    SELECT DISTINCT ON (name) id FROM work_items 
    WHERE project_id = 1 AND sort_order >= 0
    ORDER BY name, id ASC
);
