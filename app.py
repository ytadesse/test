import os
import io
import json
import PIL.Image
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

PROMPT = """You are the world's most enthusiastic dog breed expert. Analyze this image and respond ONLY with valid JSON — no markdown, no code fences, just raw JSON.

Use this exact structure:
{
  "breed": "Full breed name",
  "confidence": "high | medium | low",
  "tagline": "A punchy, fun one-liner for this breed (max 10 words)",
  "origin": {
    "country": "Country of origin",
    "era": "e.g. 19th century",
    "story": "2-3 sentences of fascinating origin history"
  },
  "fun_facts": [
    "Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5",
    "Fact 6", "Fact 7", "Fact 8", "Fact 9", "Fact 10"
  ],
  "famous_owners": [
    { "name": "Person's name", "note": "Brief fun context, e.g. owned by Queen Elizabeth II" },
    { "name": "Person's name", "note": "Brief fun context" },
    { "name": "Person's name", "note": "Brief fun context" },
    { "name": "Person's name", "note": "Brief fun context" }
  ],
  "personality_traits": ["Trait 1", "Trait 2", "Trait 3", "Trait 4", "Trait 5"],
  "ratings": {
    "energy": <1-10 integer>,
    "friendliness": <1-10 integer>,
    "trainability": <1-10 integer>,
    "fluffiness": <1-10 integer>
  },
  "celeb_lookalike": "Name of a celebrity or fictional character this breed resembles in personality"
}

If it's not a dog, respond with breed = "Mystery Beast Detected" and fill the rest humorously."""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY environment variable is not set."}), 500

    if "image" not in request.files:
        return jsonify({"error": "No image provided."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty file received."}), 400

    try:
        image_bytes = file.read()
        image = PIL.Image.open(io.BytesIO(image_bytes))
    except Exception:
        return jsonify({"error": "Could not read image. Please upload a valid JPG or PNG."}), 400

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([PROMPT, image])
    except Exception as e:
        return jsonify({"error": f"Gemini API error: {str(e)}"}), 500

    try:
        text = response.text.strip()
        # Strip markdown code fences if the model adds them
        if text.startswith("```"):
            text = text[text.index("\n") + 1:]
            text = text[:text.rfind("```")]
        data = json.loads(text)
    except Exception:
        return jsonify({"error": "Could not parse Gemini response.", "raw": response.text}), 500

    return jsonify(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host="0.0.0.0", port=port)
