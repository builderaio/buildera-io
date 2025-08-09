const UseCases = () => {
  const items = [
    {
      title: "Marketing en redes sociales",
      desc: "Publicaciones, respuestas y calendario automático para Instagram y Facebook.",
      bullets: ["Ideas y copies listos", "Publicación programada", "Respuestas 24/7"],
      color: "primary",
    },
    {
      title: "Atención al cliente 24/7",
      desc: "WhatsApp, web o redes: respuestas rápidas, agenda y seguimiento.",
      bullets: ["Preguntas frecuentes", "Agendamiento", "Escalamiento a humano"],
      color: "secondary",
    },
    {
      title: "Ventas y prospección",
      desc: "Captura leads, califícalos y haz seguimiento sin perder oportunidades.",
      bullets: ["Formularios y chat", "Lead scoring", "Recordatorios automáticos"],
      color: "accent",
    },
    {
      title: "E‑commerce",
      desc: "Catálogo, inventario y recomendaciones para mover tus productos.",
      bullets: ["Sincroniza catálogo", "Promos por temporada", "Carritos recuperados"],
      color: "primary",
    },
    {
      title: "Servicios profesionales",
      desc: "Agenda, confirmaciones y recordatorios para citas sin fricciones.",
      bullets: ["Reserva online", "Recordatorios", "Encuestas post‑servicio"],
      color: "secondary",
    },
    {
      title: "Educación y cursos",
      desc: "Matrículas, seguimiento y comunicación con estudiantes.",
      bullets: ["Inscripción simple", "Onboarding", "Progreso y avisos"],
      color: "accent",
    },
  ];

  return (
    <section id="casos-de-uso" className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">Casos de uso</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Lo que puedes automatizar hoy para reducir operación y enfocarte en crecer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((i) => (
            <article key={i.title} className="growth-card p-6">
              <h3 className={`font-heading text-xl mb-2 text-${i.color}`}>{i.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{i.desc}</p>
              <ul className="space-y-2 text-sm">
                {i.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span className="text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
