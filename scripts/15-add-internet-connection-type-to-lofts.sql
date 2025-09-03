ALTER TABLE lofts
ADD COLUMN internet_connection_type_id UUID REFERENCES internet_connection_types(id);
