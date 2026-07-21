-- AI Trademark & Brand Protection Monitor - Database Schema
-- Drop all tables in reverse dependency order

\if :{?allow_legacy_reset}
\else
\echo 'Legacy destructive reset disabled; pass -v allow_legacy_reset=1 only for an isolated non-production database.'
\quit
\endif

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS legal_cases CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS logo_analyses CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS sentiment_analyses CASCADE;
DROP TABLE IF EXISTS trademark_searches CASCADE;
DROP TABLE IF EXISTS cease_desist_letters CASCADE;
DROP TABLE IF EXISTS counterfeits CASCADE;
DROP TABLE IF EXISTS social_mentions CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS infringements CASCADE;
DROP TABLE IF EXISTS trademarks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- trademarks (portfolio management)
CREATE TABLE trademarks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  jurisdiction VARCHAR(100),
  filing_date DATE,
  expiry_date DATE,
  class VARCHAR(100),
  owner VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- infringements (AI detection)
CREATE TABLE infringements (
  id SERIAL PRIMARY KEY,
  trademark_id INTEGER REFERENCES trademarks(id),
  source_url TEXT,
  infringement_type VARCHAR(100),
  severity VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  ai_analysis TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- domains (domain monitoring)
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  domain_name VARCHAR(255) NOT NULL,
  similarity_score DECIMAL(5,2),
  registrar VARCHAR(255),
  registration_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  threat_level VARCHAR(50),
  related_trademark VARCHAR(255),
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- social_mentions
CREATE TABLE social_mentions (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(100),
  author VARCHAR(255),
  content TEXT,
  url TEXT,
  sentiment VARCHAR(50),
  reach INTEGER,
  engagement INTEGER,
  trademark_mentioned VARCHAR(255),
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- counterfeits
CREATE TABLE counterfeits (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255),
  platform VARCHAR(100),
  seller VARCHAR(255),
  url TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  evidence TEXT,
  ai_analysis TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- cease_desist_letters (AI generated)
CREATE TABLE cease_desist_letters (
  id SERIAL PRIMARY KEY,
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  trademark VARCHAR(255),
  infringement_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  letter_content TEXT,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- trademark_searches (AI)
CREATE TABLE trademark_searches (
  id SERIAL PRIMARY KEY,
  search_term VARCHAR(255),
  jurisdiction VARCHAR(100),
  status VARCHAR(50),
  results_count INTEGER,
  ai_analysis TEXT,
  searched_at TIMESTAMP DEFAULT NOW()
);

-- sentiment_analyses (AI)
CREATE TABLE sentiment_analyses (
  id SERIAL PRIMARY KEY,
  brand_name VARCHAR(255),
  source VARCHAR(100),
  period VARCHAR(50),
  positive_score DECIMAL(5,2),
  negative_score DECIMAL(5,2),
  neutral_score DECIMAL(5,2),
  summary TEXT,
  ai_analysis TEXT,
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- competitors
CREATE TABLE competitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  website VARCHAR(255),
  industry VARCHAR(100),
  threat_level VARCHAR(50),
  trademark_overlap TEXT,
  market_position VARCHAR(100),
  ai_analysis TEXT,
  last_analyzed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- logo_analyses (AI)
CREATE TABLE logo_analyses (
  id SERIAL PRIMARY KEY,
  original_brand VARCHAR(255),
  compared_brand VARCHAR(255),
  similarity_score DECIMAL(5,2),
  visual_elements TEXT,
  color_similarity DECIMAL(5,2),
  shape_similarity DECIMAL(5,2),
  risk_level VARCHAR(50),
  ai_analysis TEXT,
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- marketplace_listings
CREATE TABLE marketplace_listings (
  id SERIAL PRIMARY KEY,
  marketplace VARCHAR(100),
  product_title VARCHAR(255),
  seller VARCHAR(255),
  price DECIMAL(10,2),
  url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  is_counterfeit BOOLEAN DEFAULT false,
  trademark_matched VARCHAR(255),
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- legal_cases
CREATE TABLE legal_cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(100),
  title VARCHAR(255),
  defendant VARCHAR(255),
  case_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  jurisdiction VARCHAR(100),
  filing_date DATE,
  description TEXT,
  outcome TEXT,
  damages DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- reports (AI generated)
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  report_type VARCHAR(100),
  period VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  content TEXT,
  ai_generated BOOLEAN DEFAULT true,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- alerts
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  alert_type VARCHAR(100),
  severity VARCHAR(50),
  source VARCHAR(100),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_id INTEGER,
  related_type VARCHAR(100),
  triggered_at TIMESTAMP DEFAULT NOW()
);

-- audit_logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  performed_at TIMESTAMP DEFAULT NOW()
);
