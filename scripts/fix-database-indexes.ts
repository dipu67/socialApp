/**
 * Database fix script for duplicate key error on chatId field
 * 
 * This script will:
 * 1. Drop the existing problematic indexes
 * 2. Recreate them with sparse: true option
 * 
 * Run this script once to fix the database index issue
 */

import { connectDB } from "@/lib/db/db";
import { Users } from "@/lib/db/users";

async function fixDatabaseIndexes() {
  try {
    console.log("🔧 Starting database index fix...");
    
    // Connect to database
    await connectDB();
    
    const collection = Users.collection;
    
    console.log("📋 Listing existing indexes...");
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Drop problematic indexes if they exist
    const indexesToDrop = ['chatId_1', 'username_1', 'verificationToken_1', 'resetPasswordToken_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        const exists = indexes.find(idx => idx.name === indexName);
        if (exists) {
          console.log(`🗑️  Dropping index: ${indexName}`);
          await collection.dropIndex(indexName);
          console.log(`✅ Successfully dropped index: ${indexName}`);
        } else {
          console.log(`ℹ️  Index ${indexName} doesn't exist, skipping...`);
        }
      } catch (error: any) {
        console.log(`⚠️  Could not drop index ${indexName}:`, error?.message || error);
      }
    }
    
    // Create new sparse indexes
    console.log("🔨 Creating new sparse indexes...");
    
    try {
      await collection.createIndex({ username: 1 }, { unique: true, sparse: true, name: 'username_1_sparse' });
      console.log("✅ Created sparse index for username");
    } catch (error: any) {
      console.log("⚠️  Username index creation error:", error?.message || error);
    }
    
    try {
      await collection.createIndex({ chatId: 1 }, { unique: true, sparse: true, name: 'chatId_1_sparse' });
      console.log("✅ Created sparse index for chatId");
    } catch (error: any) {
      console.log("⚠️  ChatId index creation error:", error?.message || error);
    }
    
    try {
      await collection.createIndex({ verificationToken: 1 }, { unique: true, sparse: true, name: 'verificationToken_1_sparse' });
      console.log("✅ Created sparse index for verificationToken");
    } catch (error: any) {
      console.log("⚠️  VerificationToken index creation error:", error?.message || error);
    }
    
    try {
      await collection.createIndex({ resetPasswordToken: 1 }, { unique: true, sparse: true, name: 'resetPasswordToken_1_sparse' });
      console.log("✅ Created sparse index for resetPasswordToken");
    } catch (error: any) {
      console.log("⚠️  ResetPasswordToken index creation error:", error?.message || error);
    }
    
    console.log("📋 Final indexes:");
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes.map(idx => ({ 
      name: idx.name, 
      key: idx.key, 
      unique: idx.unique, 
      sparse: idx.sparse 
    })));
    
    console.log("🎉 Database index fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Database fix failed:", error);
    throw error;
  }
}

// Export for use in API route or direct execution
export { fixDatabaseIndexes };

// If running this file directly (for development/testing)
if (require.main === module) {
  fixDatabaseIndexes()
    .then(() => {
      console.log("✅ Fix completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fix failed:", error);
      process.exit(1);
    });
}
