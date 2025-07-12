-- Add the search vector column if it doesn't exist
ALTER TABLE "question" ADD COLUMN IF NOT EXISTS "search_vector" TSVECTOR;

-- Create the function for updating the search_vector
CREATE OR REPLACE FUNCTION update_question_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_question_search_vector_trigger ON "question";

-- Create the trigger to automatically update search_vector on insert/update
CREATE TRIGGER update_question_search_vector_trigger
BEFORE INSERT OR UPDATE ON "question"
FOR EACH ROW EXECUTE FUNCTION update_question_search_vector();

-- Populate search_vector for any existing data
UPDATE "question" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) WHERE search_vector IS NULL;

-- Create the GIN index for fast full-text queries if it doesn't exist
CREATE INDEX IF NOT EXISTS question_search_vector_idx ON "question" USING GIN (search_vector);
