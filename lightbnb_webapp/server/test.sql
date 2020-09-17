-- SELECT cost_per_night, avg(property_reviews.rating) as average_rating
--     FROM properties
--     JOIN property_reviews ON properties.id = property_id WHERE city LIKE '%ancouver%' AND cost_per_night >= 100 AND cost_per_night <= 200 
--   GROUP BY properties.id
--   HAVING avg(property_reviews.rating) >= 4
--   ORDER BY cost_per_night

  SELECT title, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id 
    WHERE city LIKE '%ancouver%'
      AND cost_per_night >= 10000
      AND cost_per_night <= 20000
  GROUP BY properties.id
  HAVING avg(property_reviews.rating) >= 4
  ORDER BY cost_per_night
