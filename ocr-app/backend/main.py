from typing import List  # Importar List desde typing
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
import os

# Configurar la ruta de Tesseract
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

# Crear la aplicación FastAPI
app = FastAPI()

# Configurar CORS para permitir el acceso desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar a dominios específicos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carpeta para guardar imágenes subidas
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/extract")
async def extract_text(files: List[UploadFile] = File(...)):  # Cambiar `list` por `List`
    try:
        extracted_data = []

        for file in files:
            file_location = os.path.join(UPLOAD_FOLDER, file.filename)
            with open(file_location, "wb") as f:
                f.write(await file.read())

            # Procesar la imagen con Tesseract
            text = pytesseract.image_to_string(Image.open(file_location))

            # Almacenar el resultado
            extracted_data.append({"file_name": file.filename, "text": text})

        return JSONResponse(content={"data": extracted_data}, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar las imágenes: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
