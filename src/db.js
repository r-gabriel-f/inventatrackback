
const createClient = require('@supabase/supabase-js').createClient;


const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const db = createClient(supabaseUrl, supabaseKey)

module.exports = db;