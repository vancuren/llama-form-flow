# LLama 4 - Form Flow

An assistant helps people navigate and fill out complicated forms using Llama 4. 

Filling out IRS tax returns, immigration petitions, or other applications can be overwhelming, especially if English isn’t your first language. Many need guidance in their native language. We built a solution using Llama 4.

Our app is a lightweight React front-end with a FastAPI backend using Llama 4’s Maverick model. Users upload form images—PDFs, PNGs, etc.—and Llama 4 reads the image, scans text, extracts labels, and maps field bounds. Then it walks the user through the form, explaining instructions.

We use Llama 4 for two purposes: ***analysis*** and ***conversation***.

The `/from/start` endpoint:

- It analyzes form images
- It identifies the input fields
- Understands each input context.
- Normalizes names like “First Name” or “Social Security Number” 
- Then returns pixel bounds that the front-end can then highlight each box.

The `/from/next` & `/form/respond` endpoints 

- Guides users field by field, in their preferred language. 
- It sends conversation history and field context (name and bounds) to Llama 4, which uses its large context window to remember earlier answers, refer back, and switch languages automatically.
- Provides additional context when users ask questions about speicfic fields.


Thanks for letting us demo!