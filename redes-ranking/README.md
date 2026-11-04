# Ranking de conexiones (LinkedIn e Instagram)

Genera un **top** de las personas que más valen la pena según tus metas y una
**lista de candidatos a revisar**. No se conecta a ninguna red, no deja de seguir
a nadie y no elimina nada. La decisión final y la acción siempre son tuyas.

## 1. Descarga tus datos (exportación oficial)

- **LinkedIn**: Ajustes → Privacidad de datos → Obtén una copia de tus datos →
  marca *Conexiones*. Descomprime el archivo y copia `Connections.csv`
  en `datos/linkedin/`.
- **Instagram**: Configuración → Tu actividad → Descarga tu información →
  formato JSON, marca *Seguidores y seguidos*. Copia la carpeta descomprimida
  dentro de `datos/instagram/` (el script busca los archivos `followers_*.json`
  y `following.json` de forma recursiva).

## 2. Define tus metas

Edita `config.json`:

- `palabras_clave_metas`: palabras que describen lo que te interesa (negocio,
  creatividad, emprendimiento, etc.). Se buscan en cargo, empresa y tus notas.
- `pesos`: cuánto cuenta cada criterio. Deben sumar 1.0.
- `umbral_eliminar`: puntaje por debajo del cual la persona entra a la lista de
  candidatos.
- `top_n`: tamaño del ranking.

## 3. Califica a las personas (opcional, pero es lo que más mejora el resultado)

Crea `datos/notas.csv` a partir de `notas.ejemplo.csv`. Solo necesitas
completar las personas que te importan. Columnas:

| columna | valores | significado |
|---|---|---|
| `red` | `linkedin` / `instagram` | red de la conexión |
| `usuario` | nombre (LinkedIn) o usuario sin @ (Instagram) | debe coincidir con el export |
| `relevancia` | 0 a 5 | qué tanto aporta a tus metas |
| `interaccion` | 0 a 5 | qué tanto interactúan contigo de verdad |
| `proteger` | `si` / vacío | nunca aparece como candidata a eliminar |
| `notas` | texto libre | contexto, por ejemplo "cliente potencial" |

## 4. Ejecuta

```bash
cd redes-ranking
python3 rankear.py
```

Salidas en `salida/`:

- `ranking_top.csv`: las mejores N personas, ordenadas por puntaje.
- `candidatos_revisar.csv`: personas bajo el umbral, de menor a mayor puntaje.
- `todas_puntuadas.csv`: todo, con los motivos de cada puntaje.

## Privacidad

`datos/` y `salida/` contienen información personal de terceros y están en
`.gitignore`: no se suben al repositorio. Pruebas con datos de ejemplo:
`python3 rankear.py --datos ejemplo/datos --notas ejemplo/datos/notas.csv --salida salida-prueba`
(`salida-prueba/` también queda fuera de git si la usas dentro de esta carpeta; si no, elige otra ruta).

## Siguiente paso (cuando lo decidas)

Eliminar o dejar de seguir se hace a mano en cada app, revisando
`candidatos_revisar.csv`. Si más adelante quieres automatizarlo, lo haría como
lote que tú apruebas antes de ejecutarlo.
