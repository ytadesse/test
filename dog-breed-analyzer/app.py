import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai.types import Part

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

ANALYSIS_PROMPT = """\
You are a world-class canine expert, dog historian, and entertaining storyteller.

Analyze the uploaded photo of a dog and respond with a JSON object (no markdown fences) that has EXACTLY these keys:

{
  "breed": "<Best guess at the breed or mix>",
  "confidence": "<high, medium, or low>",
  "tagline": "<A witty one-liner about this breed>",
  "celeb_lookalike": "<A celebrity whose personality matches this breed>",
  "origin": {
    "country": "<Country or region of origin>",
    "era": "<Era or century the breed emerged, e.g. 19th Century>",
    "story": "<2-3 sentence origin story of how this breed came to be>"
  },
  "personality_traits": ["<trait1>", "<trait2>", "<trait3>", "<trait4>", "<trait5>"],
  "ratings": {
    "energy": <1-10 integer>,
    "friendliness": <1-10 integer>,
    "trainability": <1-10 integer>,
    "fluffiness": <1-10 integer>
  },
  "fun_facts": [
    "<5 fun, surprising, or delightful facts about this breed>"
  ],
  "famous_owners": [
    {"name": "<Celebrity / historical figure>", "note": "<One-sentence fun detail>"}
  ]
}

Rules:
- Return ONLY valid JSON. No extra text, no markdown code fences.
- The fun_facts array must have exactly 5 items.
- famous_owners should have 3-5 entries.
- ratings values must be integers from 1 to 10.
- Be entertaining but accurate.
- If the image is not a dog, set breed to "Not a dog!" and fill the rest with humorous placeholders.
"""


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    image_bytes = file.read()
    mime_type = file.content_type or "image/jpeg"

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                ANALYSIS_PROMPT,
                Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )

        import json
        raw = response.text.strip()
        # Strip markdown fences if the model added them anyway
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]
        result = json.loads(raw)
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse model response", "raw": response.text}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
