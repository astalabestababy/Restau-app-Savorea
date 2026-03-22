import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cart.db';
let db;

export const initCartSQLite = async () => {
  db = await SQLite.openDatabaseAsync(DB_NAME, {
    mode: 'create-or-open'
  });
  
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      itemData TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
  
  console.log('✅ CartSQLite DB initialized');
  return db;
};

export const saveCartToSQLite = async (userId, cart) => {
  if (!db) throw new Error('DB not initialized');
  if (!userId) return;
  
  try {
    await db.runAsync(
      'DELETE FROM cart_items WHERE userId = ?',
      [userId]
    );
    
    const insertPromises = cart.map(item => {
      const itemId = item._id || item.id;
      return db.runAsync(
        'INSERT OR REPLACE INTO cart_items (id, userId, itemData, createdAt) VALUES (?, ?, ?, ?)',
        [itemId, userId, JSON.stringify(item), Date.now()]
      );
    });
    
    await Promise.all(insertPromises);
    console.log(`💾 Cart saved for user ${userId}: ${cart.length} items`);
  } catch (error) {
    console.error('Save cart error:', error);
    throw error;
  }
};

export const loadCartFromSQLite = async (userId) => {
  if (!db) throw new Error('DB not initialized');
  if (!userId) return [];
  
  try {
    const results = await db.getAllAsync(
      'SELECT itemData FROM cart_items WHERE userId = ? ORDER BY createdAt ASC',
      [userId]
    );
    
    const cart = results.map(row => JSON.parse(row.itemData));
    console.log(`📥 Cart loaded for user ${userId}: ${cart.length} items`);
    return cart;
  } catch (error) {
    console.error('Load cart error:', error);
    return [];
  }
};

export const clearCartSQLite = async (userId) => {
  if (!db) return;
  if (!userId) return;
  
  try {
    await db.runAsync(
      'DELETE FROM cart_items WHERE userId = ?',
      [userId]
    );
    console.log(`🗑️ Cart cleared for user ${userId}`);
  } catch (error) {
    console.error('Clear cart error:', error);
  }
};

export default {
  initCartSQLite,
  saveCartToSQLite,
  loadCartFromSQLite,
  clearCartSQLite
};

