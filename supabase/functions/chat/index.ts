import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_GEN_PATTERNS = [
  /\b(genera|crea|dibuja|haz|hazme|dame|diseña|pinta|ilustra|muéstrame)\b.{0,30}\b(imagen|foto|ilustración|dibujo|diseño|arte|picture|image|logo|banner|icono|poster|wallpaper|fondo)\b/i,
  /\b(generate|create|draw|make|design|paint|show me)\b.{0,30}\b(image|picture|photo|illustration|art|drawing|logo|banner|icon|poster|wallpaper)\b/i,
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, personality, memory, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const defaultPersonality = `Eres Nova, una asistente personal femenina altamente inteligente, analítica y profesional. Tienes un conocimiento profundo en múltiples áreas: ciencia, tecnología, programación, matemáticas, historia, cultura, negocios, salud y más. 

Reglas clave:
- Responde SIEMPRE en el mismo idioma que el usuario.
- Sé precisa, clara y estructurada. Usa markdown cuando mejore la legibilidad.
- Cuando te pregunten algo que requiera cálculos, razona paso a paso antes de dar la respuesta.
- Si no sabes algo con certeza, dilo honestamente en lugar de inventar.
- Mantén un tono cálido pero profesional, como una asistente ejecutiva de élite.
- Para preguntas de programación, da código funcional y bien comentado.
- Usa listas, tablas y formato cuando haga la información más digerible.
- Puedes analizar imágenes que el usuario te envíe.
- Si el usuario te pide generar una imagen, hazlo con gusto.`;

    // Get current time in Bolivia (UTC-4)
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const boliviaMs = utcMs + (-4 * 60 * 60 * 1000);
    const boliviaTime = new Date(boliviaMs);
    const boliviaTimeStr = boliviaTime.toLocaleString("es-BO", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "UTC" });

    let systemContent = personality || defaultPersonality;
    systemContent += `\n\nFecha y hora actual en Bolivia (UTC-4): ${boliviaTimeStr}. Usa SIEMPRE esta hora como referencia cuando el usuario pregunte por la hora, fecha o día actual.`;

    if (memory && memory.length > 0) {
      systemContent += "\n\n--- MEMORIA DE CONVERSACIONES ANTERIORES ---\nAquí tienes un resumen de conversaciones pasadas con el usuario para mantener contexto:\n" + memory + "\n--- FIN DE MEMORIA ---\nUsa esta memoria para dar respuestas más personalizadas y recordar preferencias del usuario.";
    }

    // Check if user wants image generation
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const isImageGen = IMAGE_GEN_PATTERNS.some(p => p.test(lastUserMsg));

    if (isImageGen) {
      // IMAGE GENERATION MODE
      const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "system", content: "You are an image generation assistant. Generate the image the user requests. Respond in the same language as the user." },
            { role: "user", content: lastUserMsg },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResponse.ok) {
        const errText = await imgResponse.text();
        console.error("Image gen error:", imgResponse.status, errText);
        return new Response(JSON.stringify({ error: "Error al generar la imagen" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imgData = await imgResponse.json();
      const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = imgData.choices?.[0]?.message?.content || "Aquí tienes la imagen generada:";

      if (base64Url) {
        // Upload to storage
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, serviceRoleKey);

          const base64Data = base64Url.split(",")[1];
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `generated/${crypto.randomUUID()}.png`;

          await supabase.storage.from("chat-images").upload(fileName, bytes, {
            contentType: "image/png",
            upsert: false,
          });

          const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);

          return new Response(JSON.stringify({
            type: "image_generation",
            text,
            imageUrl: urlData.publicUrl,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          // Fallback: return base64 directly
          return new Response(JSON.stringify({
            type: "image_generation",
            text,
            imageUrl: base64Url,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({
        type: "image_generation",
        text,
        imageUrl: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NORMAL CHAT MODE (with optional image analysis)
    const formattedMessages = messages.map((m: any, i: number) => {
      // If this is the last user message and there's an attached image
      if (image && i === messages.length - 1 && m.role === "user") {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content || "Analiza esta imagen" },
            { type: "image_url", image_url: { url: image } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se han agotado los créditos de IA. Recarga tu saldo." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
