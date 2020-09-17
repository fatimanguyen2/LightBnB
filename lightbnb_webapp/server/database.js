const db = require('./db-index');

const getUserWithEmail = function(email) {
  return db.query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then(res => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;


const getUserWithId = function(id) {
  const text = `SELECT *
          FROM users
          WHERE id = $1;`;
  
  return db.query(text, [id])
    .then(res => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    });
};
exports.getUserWithId = getUserWithId;


const addUser =  function(user) {
  const text = `INSERT INTO users (name, email, password)
          VALUES ($1, $2, $3)
          RETURNING *`;
  const params = [user.name, user.email, user.password];

  return db.query(text, params)
    .then(res => res.rows[0]);
};
exports.addUser = addUser;


const getAllReservations = function(guest_id) {
  const text = `SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10;`;

  return db.query(text [guest_id])
    .then(res => res.rows);
};
exports.getAllReservations = getAllReservations;


const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id `;

  if (options.city) {
    const res = options.city.slice(1);
    queryParams.push(`%${res}%`);
    queryString += `
    WHERE city LIKE $${queryParams.length} `;
  }
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === 1) {
      queryString += `
      WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `
      AND owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night) {
    const res = Number(options.minimum_price_per_night * 100);
    queryParams.push(res);
    if (queryParams.length === 1) {
      queryString += `
      WHERE cost_per_night >= $${queryParams.length} `;
    } else {
      queryString += `
      AND cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    const res = Number(options.maximum_price_per_night * 100);
    queryParams.push(res);
    if (queryParams.length === 1) {
      queryString += `
      WHERE cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `
      AND cost_per_night <= $${queryParams.length} `;
    }
  }

  if (options.minimum_rating) {
    const res = Number(options.minimum_rating);
    queryParams.push(res);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return db.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


const addProperty = function(property) {
  const queryParams = [];
  const queryAttributes = [];
  
  for (const key in property) {
    if (key === 'parking_spaces' || key === 'number_of_bathrooms' || key === 'number_of_bedrooms' || key === 'owner_id') {
      let convertedValue = Number(property[key]);
      queryParams.push(convertedValue);
      queryAttributes.push(key);
    } else {
      queryParams.push(property[key]);
      queryAttributes.push(key);
    }
  }

  let columns = queryAttributes.join(', ');
  let count = queryParams.map((value, index) => `$${index + 1}`).join(', ');
  const queryString = `
  INSERT INTO properties (${columns})
  VALUES (${count})
  RETURNING *`;

  return db.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.addProperty = addProperty;