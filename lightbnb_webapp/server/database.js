const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});



/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT *
  FROM users
  WHERE email = $1;
  `, [email])
    .then(res => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = {
    text:`SELECT *
          FROM users
          WHERE id = $1;`,
    values:[id],
  };

  return pool
    .query(query)
    .then(res => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const query = {
    text: `INSERT INTO users (name, email, password)
          VALUES ($1, $2, $3)
          RETURNING *`,
    values:[user.name, user.email, user.password],
  };

  return pool.query(query)
    .then(res => res.rows[0]);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id) {
  const query = {
    text: `SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10;`,
    values: [guest_id]
  };
  return pool.query(query)
    .then(res => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  // const optionKeys = Object.keys(options);
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
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function(property) {
  const queryParams = [];
  const queryAttributes = [];
  
  for (const key in property) {
    if (key === 'parking_spaces' || key === 'number_of_bathrooms' || key === 'number_of_bedrooms' || key === 'owner_id') {
      let convertedValue;
      convertedValue = Number(property[key]);
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

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.addProperty = addProperty;
