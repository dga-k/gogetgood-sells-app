import { createClient } from '@supabase/supabase-js'

// นำ URL และ Anon Key มาจากหน้า Settings > API ใน Supabase Dashboard

const supabaseUrl = 'https://sqicbdurboqyslqwptyd.supabase.co';
const supabaseKey = 'sb_publishable_Jtn64Z8U54LeCkYWomwfGw_MQdPYyxz';
export const supabase = createClient(supabaseUrl, supabaseKey)