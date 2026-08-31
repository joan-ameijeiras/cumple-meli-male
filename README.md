# ¿Qué tanto conocés a las cumpleañeras?

Encuesta doble para el cumpleaños de **Meli** y **Male**. Sin build step: es HTML/CSS/JS
plano, así que se puede servir directo desde GitHub Pages (o cualquier hosting estático)
y guarda las respuestas en Supabase.

## Cómo funciona

- Al entrar, se muestra una pantalla de recepción con un slider por persona
  para que quien responde diga qué puntaje espera sacar en cada encuesta.
- Al tocar **Empezar**, se arma una sola secuencia de preguntas que
  **intercala** una pregunta de Meli y una de Male por turno (quién arranca
  se sortea una sola vez al cargar la página). Si una encuesta tiene más
  preguntas que la otra, al final sigue solo con las que quedan.
- Dentro de cada pregunta de opción múltiple, las opciones también se
  muestran en orden aleatorio (se sortean una vez por pregunta y quedan
  fijas mientras se navega).
- Al terminar toda la secuencia, se guarda un registro en Supabase con el
  orden en que arrancó cada encuesta, los dos puntajes esperados y las
  respuestas de cada una.

## La foto de cada pregunta

No hace falta indicar una foto por pregunta. Cada pregunta "pertenece" a la
encuesta de Meli o a la de Male (según en qué lista de `SURVEYS` esté), y el
encabezado siempre muestra la foto (`photo`) y el nombre de esa encuesta. Como
ahora las preguntas se intercalan, la foto del encabezado cambia sola de Meli
a Male y viceversa a medida que avanzás.

Para que las fotos reales aparezcan, guardá los archivos como:

```
assets/meli.jpg
assets/male.jpg
```

Si un archivo falta, se muestra automáticamente un círculo con la inicial del
nombre en su lugar — no rompe nada mientras subís las imágenes.

## Archivos

```
index.html            → estructura de la encuesta
leaderboard.html       → estructura del leaderboard público
style.css              → estilos compartidos por ambas páginas
app.js                 → preguntas, estado, navegación y guardado en Supabase
leaderboard.js          → lee el ranking de Supabase y lo muestra por categoría
supabase-client.js      → credenciales y cliente de Supabase, compartido por app.js y leaderboard.js
assets/                 → poné acá meli.jpg y male.jpg (las fotos de encabezado)
```

## Agregar o editar preguntas

En `app.js`, cada pregunta vive dentro de `SURVEYS.meli.questions` o
`SURVEYS.male.questions`, con este formato:

```js
{
  id: "identificador-unico",
  type: "choice",              // o "text" para respuesta libre
  prompt: "¿Texto de la pregunta?",
  options: ["Opción A", "Opción B", "Opción C"], // solo si type es "choice"
  correct: "Opción B",
},
```

El orden en que las escribís ahí no cambia lo que ve la persona que responde
(las opciones se mezclan solas), pero sí define en qué turno de la secuencia
intercalada aparece: si es la primera de la lista, sale en el primer turno de
esa cumpleañera; si es la décima, en el décimo.

## Puntaje y leaderboard público

Al terminar el quiz, la app compara cada respuesta guardada contra el
`correct` de esa pregunta y calcula automáticamente cuántas acertó en la
encuesta de Meli y cuántas en la de Male (comparación exacta, sin
mayúsculas/minúsculas). Eso se guarda junto con el nombre que la persona
puso al arrancar.

Además de la encuesta (`index.html`), el proyecto trae una página aparte,
**`leaderboard.html`**, con el ranking ordenado por categoría (Meli / Male /
Total). Es pública: cualquiera que tenga el link puede entrar a mirarla, no
hace falta que vos la abras ni que compartas ninguna contraseña. Solo
muestra nombre y puntajes — nunca las respuestas de cada uno, esas siguen
siendo privadas.

Para que funcione hace falta una vista en Supabase que exponga solo esas
columnas (no toda la tabla `respuestas`). Corré esto en el editor SQL,
además de lo de la sección siguiente:

```sql
create view ranking as
select nombre, puntaje_meli, puntaje_male, puntaje_total,
       total_preguntas_meli, total_preguntas_male, created_at
from respuestas
order by puntaje_total desc;

grant select on ranking to anon;
```

Una vez publicado el sitio (ver "Publicar y generar el QR" más abajo), el
leaderboard queda en `tu-sitio.github.io/tu-repo/leaderboard.html`.

Si en algún momento preferís que el ranking no sea público y anunciar vos
misma a los ganadores, no hace falta tocar nada de esto: alcanza con no
compartir el link a `leaderboard.html`, y mirar la tabla directamente en
Supabase → **Table Editor → respuestas**, ordenando por la columna
`puntaje_total`.

## Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En el editor SQL, corré esto si vas a crear la tabla por primera vez:

   ```sql
   create table respuestas (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     nombre text,
     orden_encuestas text[],
     puntaje_esperado_meli integer,
     puntaje_esperado_male integer,
     puntaje_meli integer,
     puntaje_male integer,
     puntaje_total integer,
     total_preguntas_meli integer,
     total_preguntas_male integer,
     respuestas_meli jsonb,
     respuestas_male jsonb
   );

   alter table respuestas enable row level security;

   create policy "Cualquiera puede insertar respuestas"
     on respuestas for insert
     to anon
     with check (true);
   ```

   Si ya habías creado la tabla antes (versión sin puntaje), corré en cambio
   esto para agregarle las columnas nuevas sin perder lo que ya tenés
   guardado:

   ```sql
   alter table respuestas
     add column if not exists nombre text,
     add column if not exists puntaje_meli integer,
     add column if not exists puntaje_male integer,
     add column if not exists puntaje_total integer,
     add column if not exists total_preguntas_meli integer,
     add column if not exists total_preguntas_male integer;
   ```

3. En **Project Settings → API**, copiá la **Project URL** y la **anon
   public key**, y pegalas en `supabase-client.js` en `SUPABASE_URL` y
   `SUPABASE_ANON_KEY` (ya están cargadas en este proyecto, y las usan tanto
   `app.js` como `leaderboard.js`).

## Publicar y generar el QR

1. Subí esta carpeta a un repositorio de GitHub.
2. Activá **GitHub Pages** (Settings → Pages → Deploy from branch) apuntando
   a la raíz del repo.
3. Generá un código QR que apunte a la URL que te da GitHub Pages. No hace
   falta lógica especial en el QR: el sorteo de quién arranca y el
   intercalado de preguntas los hace la página sola al abrirse.

## Revisión de ortografía, gramática y persona gramatical

Todas las preguntas quedaron en primera persona (como si Meli y Male las
estuvieran haciendo sobre sí mismas) y con acentos corregidos. Cambios
puntuales:

**Meli**
- "cuando", "cual", "a que hs nacio", "cuantos", "cuantas", "a que division"
  → con sus acentos: *cuándo*, *cuál*, *a qué hora nací*, *cuántos*,
  *cuántas*, *a qué división*.
- "canto" → "canté" (primera persona).
- "Adios nonino" → "Adiós Nonino" (nombre propio, con mayúscula y acento).
- "tatus" → "tatuajes".

**Male**
- "cuando", "a que division", "cual", "cuantas" → con acentos.
- "canto" → "canté" (primera persona); "iba" ya estaba en primera persona.
- "Northern lights" → "Northern Lights"; "cantate domino" → "Cantate
  Domino"; "guayaboso" → "Guayaboso" (nombres propios, con mayúscula).
- "Yaguaretes" → "Yaguaretés" (lleva tilde).
- "estacion favorita del año" y "medio de transporte favorito" pasaron a
  preguntas completas: "¿Cuál es mi estación favorita del año?" y "¿Cuál es
  mi medio de transporte favorito?". Para la estación, agregué "Verano" y
  "Otoño" como distractores (solo indicaste que Primavera era la correcta).
- "le gustan los autos: V/F" y "leyó el Quijote a los 10: V/F" pasaron a
  afirmaciones en primera persona con Verdadero/Falso: "Me gustan los
  autos." (Falso) y "Leí el Quijote a los 10 años." (Falso).
