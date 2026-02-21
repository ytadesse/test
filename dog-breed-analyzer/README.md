# Dog Breed Analyzer

Upload a photo of a dog and get an AI-powered deep dive into the breed — 10 fun facts, origin story, famous owners, care tips, compatibility scores, and more.

Built with **Flask**, **Tailwind CSS**, and **Google Gemini AI**.

## Setup

### 1. Install dependencies

```bash
cd dog-breed-analyzer
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set your Gemini API key

Get a free key at https://aistudio.google.com/apikey, then:

```bash
cp .env.example .env
# Edit .env and paste your key
```

Or export it directly:

```bash
export GEMINI_API_KEY="your-key-here"
```

### 3. Run the app

```bash
python app.py
```

Open http://localhost:5000 in your browser.

## How it works

1. You upload a dog photo (JPG, PNG, WebP, or GIF, up to 16 MB).
2. The image is sent to Google Gemini's vision model.
3. Gemini identifies the breed and generates a structured JSON response with fun facts, history, famous owners, care tips, and compatibility scores.
4. The frontend renders everything in a polished, card-based UI.

## Configuration

| Environment Variable | Default             | Description              |
|---------------------|---------------------|--------------------------|
| `GEMINI_API_KEY`    | *(required)*        | Your Google Gemini API key |
| `GEMINI_MODEL`      | `gemini-2.5-flash`  | Gemini model to use      |
