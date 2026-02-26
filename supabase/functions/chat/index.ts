import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, personality, memory } = await req.json();
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
- Usa listas, tablas y formato cuando haga la información más digerible.`;
    
    // Get current time in Bolivia (UTC-4) with precise calculation
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const boliviaMs = utcMs + (-4 * 60 * 60 * 1000);
    const boliviaTime = new Date(boliviaMs);
    const boliviaTimeStr = boliviaTime.toLocaleString("es-BO", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "UTC" });
    
    let systemContent = personality || defaultPersonality;
    systemContent += `\n\nFecha y hora actual en Bolivia (UTC-4): ${boliviaTimeStr}. Usa SIEMPRE esta hora como referencia cuando el usuario pregunte por la hora, fecha o día actual.`;
    
    // Add memory from past conversations if available
    if (memory && memory.length > 0) {
      systemContent += "\n\n--- MEMORIA DE CONVERSACIONES ANTERIORES ---\nAquí tienes un resumen de conversaciones pasadas con el usuario para mantener contexto:\n" + memory + "\n--- FIN DE MEMORIA ---\nUsa esta memoria para dar respuestas más personalizadas y recordar preferencias del usuario.";
    }

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
          ...messages,
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
