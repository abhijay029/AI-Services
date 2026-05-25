from fastapi import FastAPI
from transformers import pipeline
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class TextRequest(BaseModel):

    text: str

class ClassificationRequest(BaseModel):

    text: str
    labels: list[str]

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = pipeline(model="distilbert/distilbert-base-uncased-finetuned-sst-2-english", task = "text-classification")
generator = pipeline("text-generation", model="HuggingFaceTB/SmolLM2-135M")
zero_shot = pipeline(model="facebook/bart-large-mnli", task = "zero-shot-classification")

@app.get('/')
def home():
    return {'message':'Welcome'}

@app.post('/predict')
def predict(request: TextRequest):
    
    response = classifier(request.text)[0]

    return response

@app.post('/generate')
def generate_text(request: TextRequest):

    response = generator(request.text)[0]

    return response

@app.post('/classification')
def text_classification(request: ClassificationRequest):

    response = zero_shot(request.text, candidate_labels = request.labels)

    return response