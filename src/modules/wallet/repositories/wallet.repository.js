const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class WalletRepository {
  async ensureWalletWithClient(client, userId) {
    const { rows } = await client.query(
      `INSERT INTO wallets (id, user_id, available_balance, locked_balance)
       VALUES ($1,$2,0,0)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [uuidv4(), userId],
    );
    return rows[0];
  }

  async ensureWallet(userId) {
    const { rows } = await postgresPool.query(
      `INSERT INTO wallets (id, user_id, available_balance, locked_balance)
       VALUES ($1,$2,0,0)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [uuidv4(), userId],
    );
    return rows[0];
  }

  async findWalletByUserId(userId) {
    const { rows } = await postgresPool.query("SELECT * FROM wallets WHERE user_id = $1 LIMIT 1", [userId]);
    return rows[0] || null;
  }

  async creditWallet(userId, amount, meta) {
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");
      await this.ensureWalletWithClient(client, userId);
      await client.query(
        "UPDATE wallets SET available_balance = available_balance + $2 WHERE user_id = $1",
        [userId, amount],
      );
      await client.query(
        `INSERT INTO wallet_transactions (
          id, user_id, type, status, amount, reference_type, reference_id, metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          uuidv4(),
          userId,
          "credit",
          "completed",
          amount,
          meta.referenceType,
          meta.referenceId || null,
          JSON.stringify(meta.metadata || {}),
        ],
      );
      const { rows: walletRows } = await client.query("SELECT * FROM wallets WHERE user_id = $1 LIMIT 1", [userId]);
      await client.query("COMMIT");
      return walletRows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async holdWalletAmount(userId, amount, referenceId, metadata = {}) {
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");
      await this.ensureWalletWithClient(client, userId);
      const { rows: walletRows } = await client.query(
        `UPDATE wallets
         SET available_balance = available_balance - $2,
             locked_balance = locked_balance + $2
         WHERE user_id = $1 AND available_balance >= $2
         RETURNING *`,
        [userId, amount],
      );
      if (!walletRows[0]) {
        throw new Error("Insufficient wallet balance");
      }

      await client.query(
        `INSERT INTO wallet_transactions (
          id, user_id, type, status, amount, reference_type, reference_id, metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          uuidv4(),
          userId,
          "debit",
          "held",
          amount,
          "order",
          referenceId,
          JSON.stringify(metadata),
        ],
      );
      await client.query("COMMIT");
      return walletRows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async captureHeldAmount(userId, referenceId) {
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");
      const { rows: heldRows } = await client.query(
        `SELECT * FROM wallet_transactions
         WHERE user_id = $1 AND reference_id = $2 AND status = 'held'
         ORDER BY created_at DESC LIMIT 1`,
        [userId, referenceId],
      );
      const heldTx = heldRows[0];
      if (!heldTx) {
        await client.query("COMMIT");
        return null;
      }

      await client.query(
        "UPDATE wallets SET locked_balance = locked_balance - $2 WHERE user_id = $1",
        [userId, heldTx.amount],
      );
      await client.query("UPDATE wallet_transactions SET status = 'completed' WHERE id = $1", [heldTx.id]);
      await client.query("COMMIT");
      return heldTx;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async releaseHeldAmount(userId, referenceId) {
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");
      const { rows: heldRows } = await client.query(
        `SELECT * FROM wallet_transactions
         WHERE user_id = $1 AND reference_id = $2 AND status = 'held'
         ORDER BY created_at DESC LIMIT 1`,
        [userId, referenceId],
      );
      const heldTx = heldRows[0];
      if (!heldTx) {
        await client.query("COMMIT");
        return null;
      }

      await client.query(
        `UPDATE wallets
         SET locked_balance = locked_balance - $2,
             available_balance = available_balance + $2
         WHERE user_id = $1`,
        [userId, heldTx.amount],
      );
      await client.query("UPDATE wallet_transactions SET status = 'released' WHERE id = $1", [heldTx.id]);
      await client.query("COMMIT");
      return heldTx;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listTransactions(userId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return rows;
  }
}

module.exports = { WalletRepository };
