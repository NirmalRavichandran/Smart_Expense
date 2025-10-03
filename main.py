from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
import shutil
import os

app = FastAPI()

# Allow frontend (React) to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Gradio app (replace with your Gradio app URL)
gr_client = Client("https://397525c35ac475fd5f.gradio.live")

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Save file temporarily
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Send file to Gradio
    try:
        result = gr_client.predict(
            file=handle_file(temp_file),  # ✅ match the keyword argument
            api_name="/predict"
        )

    finally:
        os.remove(temp_file)  # Clean up

    return {"result": result}
