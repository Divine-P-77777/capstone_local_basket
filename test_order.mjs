import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(Boolean).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  // 1. Sign up a test user
  const email = `testuser${Math.floor(Math.random() * 10000)}@testdomain.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        user_role: 'customer'
      }
    }
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User created:', userId);

  // 2. Fetch a shop to associate with the order
  const { data: shops } = await supabase.from('shops').select('id').limit(1);
  const shopId = shops?.[0]?.id;
  
  if (!shopId) {
      console.log('No shops found.');
      return;
  }

  // 3. Create an order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: userId,
      shop_id: shopId,
      total_amount: 100,
      status: 'pending',
      delivery_address: 'Test Address',
      customer_location: 'POINT(77 28)'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order insert error:', orderError);
    return;
  }

  console.log('Order created:', order.id);

  // 4. Try fetching the order using the same query as the frontend
  const { data: fetchedOrder, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      shops (
        shop_name,
        address,
        phone
      ),
      order_items (
        quantity,
        price_at_order,
        products (
          name,
          unit,
          image_url
        )
      )
    `)
    .eq('id', order.id)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
  } else {
    console.log('Order fetched successfully:', fetchedOrder ? 'Yes' : 'No');
  }
}

runTest();
