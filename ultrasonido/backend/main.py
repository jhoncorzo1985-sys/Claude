"""
Analizador de Ultrasonido con IA - Backend FastAPI
Usa Claude Vision API para analizar imágenes médicas de ultrasonido.
"""

import os
import base64
import json
from io import BytesIO
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import anthropic
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Analizador de Ultrasonido IA",
    description="Analiza imágenes de ultrasonido usando Claude Vision API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

PROMPT_SISTEMA = """Eres un radiólogo educativo especializado en ultrasonografía.
Tu rol es EXCLUSIVAMENTE educativo: ayudas a estudiantes y profesionales de la salud
a comprender las imágenes de ultrasonido.

IMPORTANTE: Tus respuestas son solo para fines educativos y de aprendizaje.
NO constituyen un diagnóstico médico. Siempre recomiendar consultar un médico certificado.

Analiza la imagen de ultrasonido proporcionada y responde ÚNICAMENTE con un JSON válido
con esta estructura exacta (sin markdown, sin texto extra):

{
  "calidad_imagen": "buena|regular|mala",
  "region_anatomica": "descripción de la región anatómica visible",
  "hallazgos": [
    "hallazgo educativo 1",
    "hallazgo educativo 2"
  ],
  "estructuras_identificadas": [
    "estructura 1",
    "estructura 2"
  ],
  "impresion": "Descripción educativa general de la imagen",
  "recomendaciones": [
    "recomendación educativa 1"
  ],
  "nivel_confianza": "alto|medio|bajo",
  "advertencia": "Esta interpretación es solo con fines educativos. No reemplaza el diagnóstico de un médico certificado."
}

Si la imagen NO es un ultrasonido médico, responde:
{
  "error": "La imagen proporcionada no parece ser una imagen de ultrasonido médico.",
  "advertencia": "Por favor, suba una imagen de ultrasonido válida."
}"""


class ImagenRequest(BaseModel):
    imagen_base64: str
    media_type: str = "image/jpeg"
    contexto: Optional[str] = None


class ResultadoAnalisis(BaseModel):
    calidad_imagen: Optional[str] = None
    region_anatomica: Optional[str] = None
    hallazgos: Optional[list] = None
    estructuras_identificadas: Optional[list] = None
    impresion: Optional[str] = None
    recomendaciones: Optional[list] = None
    nivel_confianza: Optional[str] = None
    advertencia: Optional[str] = None
    error: Optional[str] = None


def validar_imagen(imagen_base64: str, media_type: str) -> bool:
    """Valida que el base64 sea una imagen válida."""
    if media_type not in ALLOWED_MEDIA_TYPES:
        return False
    try:
        datos = base64.b64decode(imagen_base64)
        img = Image.open(BytesIO(datos))
        img.verify()
        return True
    except Exception:
        return False


def construir_prompt_usuario(contexto: Optional[str]) -> str:
    base = "Analiza esta imagen de ultrasonido con fines educativos."
    if contexto:
        base += f" Contexto adicional: {contexto}"
    return base


@app.get("/health")
async def health_check():
    """Verifica que el servicio esté activo."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    return {
        "status": "ok",
        "api_configurada": bool(api_key and api_key.startswith("sk-")),
    }


@app.post("/analizar", response_model=ResultadoAnalisis)
async def analizar_ultrasonido(request: ImagenRequest):
    """
    Analiza una imagen de ultrasonido usando Claude Vision API.

    - **imagen_base64**: Imagen codificada en base64
    - **media_type**: Tipo MIME (image/jpeg, image/png, image/webp)
    - **contexto**: Contexto clínico opcional (ej: "paciente 30 años, dolor abdominal")
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY no configurada. Revisa el archivo .env",
        )

    if not validar_imagen(request.imagen_base64, request.media_type):
        raise HTTPException(
            status_code=400,
            detail=f"Imagen inválida. Tipos permitidos: {', '.join(ALLOWED_MEDIA_TYPES)}",
        )

    try:
        cliente = anthropic.Anthropic(api_key=api_key)

        mensaje = cliente.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=PROMPT_SISTEMA,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": request.media_type,
                                "data": request.imagen_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": construir_prompt_usuario(request.contexto),
                        },
                    ],
                }
            ],
        )

        texto_respuesta = mensaje.content[0].text.strip()

        # Limpiar posible markdown
        if texto_respuesta.startswith("```"):
            lineas = texto_respuesta.split("\n")
            texto_respuesta = "\n".join(lineas[1:-1])

        resultado = json.loads(texto_respuesta)
        return ResultadoAnalisis(**resultado)

    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="API Key de Anthropic inválida.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Límite de uso de la API alcanzado. Intenta más tarde.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error al procesar la respuesta de IA.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")


# Servir el frontend desde /frontend
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    @app.get("/")
    async def root():
        return FileResponse(os.path.join(frontend_path, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
