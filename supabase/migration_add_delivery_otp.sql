-- Add delivery_otp column to orders table for verification
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6);

-- Optional: Create an index if you plan to search orders by OTP frequently
-- CREATE INDEX IF NOT EXISTS idx_orders_delivery_otp ON public.orders(delivery_otp);
