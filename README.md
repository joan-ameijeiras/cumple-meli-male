# ¿Qué tanto conocés a las cumpleañeras?

Encuesta doble para el cumpleaños de **Meli** y **Male**. Sin build step: es HTML/CSS/JS
plano, así que se puede servir directo desde GitHub Pages (o cualquier hosting estático)
y guarda las respuestas en Supabase.

## Cómo funciona

- Al entrar, se muestra una pantalla de recepción ("¿Qué tanto conocés a las
  cumpleañeras?") con un slider por persona para que quien responde diga qué
  puntaje espera sacar.
- Al tocar **Empezar**, se elige al azar cuál de las dos encuestas se responde
  primero (queda fijo durante esa sesión, no se vuelve a sortear al ir para
  atrás).
- Dentro de cada encuesta, las opciones de cada pregunta también se muestran
  en orden aleatorio (se sortean una vez por pregunta y quedan fijas mientras
  se navega).
- Si la encuesta de Male todavía no tiene preguntas cargadas, se muestra una
  pantalla de "todavía se están armando" en su lugar.
- Al terminar ambas encuestas, se guarda un registro en Supabase con el orden
  en que se mostraron, los dos puntajes esperados y las respuestas de cada
  encuesta.

## Archivos

```
index.html   → estructura de la página
style.css    → estilos (paleta, tipografía, layout)
app.js       → preguntas, estado, navegación y guardado en Supabase
assets/      → poné acá meli.jpg y male.jpg (las fotos de encabezado)
```

Si falta una foto, se muestra automáticamente un círculo con la inicial del
nombre en su lugar — no rompe nada mientras subís las imágenes.

## Cargar las preguntas de Male

En `app.js`, buscá el bloque `male` dentro de `SURVEYS` y completá `questions`
con el mismo formato que las de Meli:

```js
{
  id: "identificador-unico",
  type: "choice",              // o "text" para respuesta libre
  prompt: "¿Texto de la pregunta?",
  options: ["Opción A", "Opción B", "Opción C"], // solo si type es "choice"
  correct: "Opción B",
},
```

## Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En el editor SQL, corré:

   ```sql
   create table respuestas (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     orden_encuestas text[],
     puntaje_esperado_meli integer,
     puntaje_esperado_male integer,
     respuestas_meli jsonb,
     respuestas_male jsonb
   );

   alter table respuestas enable row level security;

   create policy "Cualquiera puede insertar respuestas"
     on respuestas for insert
     to anon
     with check (true);
   ```

3. En **Project Settings → API**, copiá la **Project URL** y la **anon public
   key**.
4. Pegalas en `app.js`, al principio del archivo, en `SUPABASE_URL` y
   `SUPABASE_ANON_KEY`.

Mientras esos dos valores queden con el texto de ejemplo, la app funciona
igual pero solo imprime el resultado en la consola del navegador (útil para
probar antes de conectar la base).

## Publicar y generar el QR

1. Subí esta carpeta a un repositorio de GitHub.
2. Activá **GitHub Pages** (Settings → Pages → Deploy from branch) apuntando
   a la raíz del repo.
3. Generá un código QR que apunte a la URL que te da GitHub Pages (cualquier
   generador de QR online sirve). No hace falta lógica especial en el QR: el
   sorteo de qué encuesta va primero lo hace la página sola al abrirse.

## Revisión de ortografía y gramática (encuesta de Meli)

Se corrigieron estos puntos respecto del texto original:
- Acentos faltantes: *qué*, *cuántos*, *cuántas* (ya estaban bien en algunos
  casos, se unificó en todos), *cantó*, *división*.
- "Adios nonino" → "Adiós Nonino" (nombre propio de la obra, con mayúscula y
  acento).
- Mayúscula inicial en "¿cuantos pianistas...?".
- Coma antes de las preguntas encadenadas: "En la primaria, ¿era..." y "En la
  secundaria, ¿a qué...".
- "tatus" → "tatuajes"; se agregó la coma en "Uno, por accidente".
- `\bold{el}` se resolvió como el énfasis que probablemente buscabas: la
  palabra "el" va en negrita dentro de la pregunta del vestido.
