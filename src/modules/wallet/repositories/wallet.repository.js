const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class WalletRepository {
  async ensureWalletWithClient(client, userId) {
    const [wallet] = await client("wallets")
      .insert({ id: uuidv4(), user_id: userId, available_balance: 0, locked_balance: 0 })
      .onConflict("user_id")
      .merge({ user_id: userId })
      .returning("*");
    return wallet;
  }

  async ensureWallet(userId) {
    const [wallet] = await knex("wallets")
      .insert({ id: uuidv4(), user_id: userId, available_balance: 0, locked_balance: 0 })
      .onConflict("user_id")
      .merge({ user_id: userId })
      .returning("*");
    return wallet;
  }

  async findWalletByUserId(userId) {
    const [wallet] = await knex("wallets").where("user_id", userId).limit(1);
    return wallet || null;
  }

  async creditWallet(userId, amount, meta) {
    const trx = await knex.transaction();

    try {
      await this.ensureWalletWithClient(trx, userId);
      await trx("wallets").where("user_id", userId).increment("available_balance", amount);
      await trx("wallet_transactions").insert({
        id: uuidv4(),
        user_id: userId,
        type: "credit",
        status: "completed",
        amount,
        reference_type: meta.referenceType,
        reference_id: meta.referenceId || null,
        metadata: JSON.stringify(meta.metadata || {}),
      });

      const [wallet] = await trx("wallets").where("user_id", userId).limit(1);
      await trx.commit();
      return wallet;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async holdWalletAmount(userId, amount, referenceId, metadata = {}) {
    const trx = await knex.transaction();

    try {
      await this.ensureWalletWithClient(trx, userId);
      const [wallet] = await trx("wallets")
        .where("user_id", userId)
        .andWhere("available_balance", ">=", amount)
        .update({
          available_balance: knex.raw("available_balance - ?", [amount]),
          locked_balance: knex.raw("locked_balance + ?", [amount]),
        })
        .returning("*");

      if (!wallet) {
        throw new Error("Insufficient wallet balance");
      }

      await trx("wallet_transactions").insert({
        id: uuidv4(),
        user_id: userId,
        type: "debit",
        status: "held",
        amount,
        reference_type: "order",
        reference_id: referenceId,
        metadata: JSON.stringify(metadata),
      });
      await trx.commit();
      return wallet;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async captureHeldAmount(userId, referenceId) {
    const trx = await knex.transaction();

    try {
      const [heldTx] = await trx("wallet_transactions")
        .where({ user_id: userId, reference_id: referenceId, status: "held" })
        .orderBy("created_at", "desc")
        .limit(1);

      if (!heldTx) {
        await trx.commit();
        return null;
      }

      await trx("wallets").where("user_id", userId).decrement("locked_balance", heldTx.amount);
      await trx("wallet_transactions").where("id", heldTx.id).update({ status: "completed" });
      await trx.commit();
      return heldTx;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async releaseHeldAmount(userId, referenceId) {
    const trx = await knex.transaction();

    try {
      const [heldTx] = await trx("wallet_transactions")
        .where({ user_id: userId, reference_id: referenceId, status: "held" })
        .orderBy("created_at", "desc")
        .limit(1);

      if (!heldTx) {
        await trx.commit();
        return null;
      }

      await trx("wallets")
        .where("user_id", userId)
        .update({
          locked_balance: knex.raw("locked_balance - ?", [heldTx.amount]),
          available_balance: knex.raw("available_balance + ?", [heldTx.amount]),
        });
      await trx("wallet_transactions").where("id", heldTx.id).update({ status: "released" });
      await trx.commit();
      return heldTx;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async listTransactions(userId) {
    return knex("wallet_transactions").where("user_id", userId).orderBy("created_at", "desc");
  }
}

module.exports = { WalletRepository };
