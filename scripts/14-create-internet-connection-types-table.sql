CREATE TABLE internet_connection_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- e.g., 'Fiber', 'ADSL', '4G'
  speed TEXT, -- e.g., '100 Mbps', '20 Mbps', '500 Mbps'
  provider TEXT, -- e.g., 'Djezzy', 'Mobilis', 'Ooredoo', 'Algerie Telecom'
  status TEXT, -- e.g., 'active', 'inactive', 'pending', 'disconnected'
  cost NUMERIC(10, 2) -- price in local currency, e.g., 2500.00
);
