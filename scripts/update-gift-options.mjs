#!/usr/bin/env node

/**
 * Update gift options (checkout gift packaging) according to new package price list.
 * - Deactivates old options like "Osnovno darilo" and "Luksuzno darilo" if present.
 * - Upserts new named packages (Paket oranžko, zelenko, vijola, mix, domačko, jesenko).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env, .env.local, .env.production + process.env
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envProdPath = path.resolve(process.cwd(), '.env.production');

const env = {
  ...dotenv.parse(fs.existsSync(envPath) ? fs.readFileSync(envPath) : ''),
  ...dotenv.parse(fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath) : ''),
  ...dotenv.parse(fs.existsSync(envProdPath) ? fs.readFileSync(envProdPath) : ''),
  ...process.env
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in env files');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NEW_OPTIONS = [
  {
    name: 'Paket oranžko',
    price: 16.0,
    description: 'Bučno olje 0,5l in bučna semena 200g.'
  },
  {
    name: 'Paket zelenko',
    price: 13.0,
    description: 'Konopljin čaj 20g in konopljino olje 0,25l.'
  },
  {
    name: 'Paket vijola',
    price: 16.0,
    description: 'Pegasti badelj 250g in sok aronije 0,5l.'
  },
  {
    name: 'Paket mix',
    price: 16.0,
    description: 'Ameriški slamnik 20g, kamilica 20g in sok aronije 0,5l.'
  },
  {
    name: 'Paket domačko',
    price: 17.5,
    description: 'Bučno olje 0,5l ter ajdova ali prosena kaša 1kg.'
  },
  {
    name: 'Paket jesenko',
    price: 18.0,
    description: 'Bučno olje 0,5l, ajdova in prosena kaša 0,5kg.'
  }
];

async function main() {
  console.log('🔄 Updating gift_options table...');

  try {
    // Deactivate old options if they exist
    const oldNames = ['Osnovno darilo', 'Luksuzno darilo'];
    const { error: deactivateError } = await supabase
      .from('gift_options')
      .update({ is_active: false })
      .in('name', oldNames);

    if (deactivateError) {
      console.error('⚠️ Error deactivating old gift options:', deactivateError.message);
    } else {
      console.log('✅ Old gift options (if any) were deactivated.');
    }

    // Fetch existing options to know which ones to insert vs update
    const { data: existing, error: fetchError } = await supabase
      .from('gift_options')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching current gift_options:', fetchError.message);
      process.exit(1);
    }

    const existingByName = new Map();
    (existing || []).forEach((opt) => existingByName.set(opt.name, opt));

    for (const opt of NEW_OPTIONS) {
      const existingRow = existingByName.get(opt.name);

      if (existingRow) {
        console.log(`💰 Updating gift option: ${opt.name}`);
        const { error } = await supabase
          .from('gift_options')
          .update({
            price: opt.price,
            description: opt.description,
            is_active: true
          })
          .eq('id', existingRow.id);

        if (error) {
          console.error(`❌ Error updating ${opt.name}:`, error.message);
        } else {
          console.log(`✅ Updated ${opt.name}`);
        }
      } else {
        console.log(`➕ Inserting new gift option: ${opt.name}`);
        const { error } = await supabase
          .from('gift_options')
          .insert({
            name: opt.name,
            price: opt.price,
            description: opt.description,
            is_active: true
          });

        if (error) {
          console.error(`❌ Error inserting ${opt.name}:`, error.message);
        } else {
          console.log(`✅ Inserted ${opt.name}`);
        }
      }
    }

    console.log('🎉 Gift options updated.');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

main();
