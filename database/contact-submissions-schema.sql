-- Contact submissions table for storing form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  preferred_contact VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone')),
  source VARCHAR(50) NOT NULL CHECK (source IN ('contact-form', 'property-inquiry', 'service-inquiry', 'newsletter', 'callback-request')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  client_ip VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_source ON contact_submissions(source);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_metadata ON contact_submissions USING GIN(metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- RLS policies (if using Row Level Security)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all submissions
CREATE POLICY "Authenticated users can read contact submissions" ON contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert submissions
CREATE POLICY "Service role can insert contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy for authenticated users to update submissions
CREATE POLICY "Authenticated users can update contact submissions" ON contact_submissions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  interests TEXT[] DEFAULT '{}',
  locale VARCHAR(10) DEFAULT 'en',
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for newsletter subscriptions
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_locale ON newsletter_subscriptions(locale);

-- RLS policies for newsletter subscriptions
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read newsletter subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can unsubscribe themselves" ON newsletter_subscriptions
  FOR UPDATE USING (true);

-- Comments for documentation
COMMENT ON TABLE contact_submissions IS 'Stores all form submissions from the public website';
COMMENT ON COLUMN contact_submissions.source IS 'The form type that generated this submission';
COMMENT ON COLUMN contact_submissions.status IS 'Current status of the submission in the sales process';
COMMENT ON COLUMN contact_submissions.metadata IS 'Additional form-specific data stored as JSON';
COMMENT ON COLUMN contact_submissions.client_ip IS 'IP address of the submitter for spam detection';

COMMENT ON TABLE newsletter_subscriptions IS 'Stores newsletter subscription information';
COMMENT ON COLUMN newsletter_subscriptions.interests IS 'Array of interest categories selected by subscriber';
COMMENT ON COLUMN newsletter_subscriptions.locale IS 'Preferred language for newsletter content';