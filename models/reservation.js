/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET customer_id =$1, start_at=$2, num_guests=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
    }
  }
  /** return top 10 customers with most reservations */
  static async findTopTen() {
    const results =
      await db.query(`SELECT customer_id AS "customerId", COUNT(*) AS "reservationCount"
    FROM reservations
    GROUP BY customer_id
    ORDER BY "reservationCount" DESC
    LIMIT 10`);
    if (results.rows.length === 0) {
      const err = new Error(
        `There are no reservations right now.  Try again later.`
      );
      err.status = 404;
      throw err;
    }
    return results.rows;
  }
}

module.exports = Reservation;
