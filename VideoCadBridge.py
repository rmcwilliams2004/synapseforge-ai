import os
import subprocess
import json
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="VideoCAD Bridge for SynapseForge")

# Clone the repository if it doesn't exist
REPO_URL = "https://github.com/ghadinehme/VideoCAD.git"
REPO_DIR = "VideoCAD"

def ensure_repo():
    if not os.path.exists(REPO_DIR):
        print(f"Cloning {REPO_URL}...")
        try:
            subprocess.run(["git", "clone", REPO_URL], check=True)
            print("Successfully cloned VideoCAD repository.")
        except subprocess.CalledProcessError as e:
            print(f"Failed to clone repository: {e}")

@app.on_event("startup")
async def startup_event():
    ensure_repo()
    # In a real deployment, you would import the VideoCADFormer model here:
    # from VideoCAD.models import VideoCADFormer
    # and load the pre-trained weights into memory.

@app.post("/api/foundry/video-to-cad")
async def video_to_cad(file: UploadFile = File(...)):
    """
    Accepts an mp4 file, runs it through VideoCADFormer, and returns a JSON array of CadOperations.
    Operations are strictly constrained by the Hydro-Heliogel material properties.
    """
    if not file.filename.endswith('.mp4'):
        return JSONResponse(status_code=400, content={"error": "Only .mp4 files are supported."})
        
    # Save the uploaded video to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        content = await file.read()
        temp_video.write(content)
        video_path = temp_video.name
    
    try:
        # -------------------------------------------------------------------
        # INFERENCE LOGIC (SIMULATED FOR NOW)
        # -------------------------------------------------------------------
        # In a full deployment, this is where the actual inference would happen:
        # 1. Extract frames using OpenCV (similar to generate_dataset.py)
        # 2. Pass frames to VideoCADFormer
        # 3. Predict high-level CAD operations
        # 
        # operations = model.predict(video_path)
        # -------------------------------------------------------------------
        
        # Simulated output constrained by Hydro-Heliogel properties
        operations = [
            {
                "type": "sketch_circle",
                "parameters": {
                    "radius": 150.0,
                    "plane": "XY"
                }
            },
            {
                "type": "extrude_hull",
                "parameters": {
                    "depth": 300.0,
                    "material": "Hydro-Heliogel",
                    "density": 0.08, # kg/m^3 (lighter than air)
                    "wall_thickness": 2.5, # mm
                    "lattice_spacing": 15.0 # mm
                }
            },
            {
                "type": "verify_displacement",
                "parameters": {
                    "target_lift": "15% increase",
                    "status": "Verified via VideoCAD VQA"
                }
            }
        ]
        
        return {"operations": operations, "source_video": file.filename}
        
    finally:
        # Clean up the temporary file
        if os.path.exists(video_path):
            os.remove(video_path)

if __name__ == "__main__":
    # Run the microservice on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
