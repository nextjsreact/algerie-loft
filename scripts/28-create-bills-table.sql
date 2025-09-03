-- Create bills table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL NOT NULL,
    due_date TIMESTAMP NOT NULL,
    prochaine_echeance_energie TIMESTAMP
);
