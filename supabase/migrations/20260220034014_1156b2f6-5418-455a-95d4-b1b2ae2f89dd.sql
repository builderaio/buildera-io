
-- Seed hook templates (Larry methodology)
INSERT INTO public.marketing_hook_templates (tier, tier_name, hook_text, hook_description, category, platform_optimized, views_reference, language, sort_order) VALUES
-- Tier 1: Person + Conflict (ES)
(1, 'Person + Conflict', 'Le mostré a mi {persona} lo que la IA piensa que debería verse {cosa}', 'Conflicto personal + IA como mediador. Genera curiosidad y controversia.', 'general', ARRAY['tiktok','instagram'], '161K views', 'es', 1),
(1, 'Person + Conflict', 'Mi {persona} dijo que no puedo cambiar nada, así que le mostré esto', 'Restricción + solución IA. Empatía inmediata.', 'general', ARRAY['tiktok','instagram'], '124K views', 'es', 2),
(1, 'Person + Conflict', '{Persona} no creía que la IA pudiera hacer esto hasta que le mostré', 'Escepticismo → prueba. Engagement por curiosidad.', 'general', ARRAY['tiktok','instagram','youtube'], NULL, 'es', 3),
(1, 'Person + Conflict', 'Mi {persona} me retó a mejorar {cosa} con IA y esto pasó', 'Reto + resultado. Narrativa de transformación.', 'general', ARRAY['tiktok','instagram'], NULL, 'es', 4),
-- Tier 2: Budget Pain (ES)
(2, 'Budget Pain', 'POV: Tienes buen gusto pero no presupuesto', 'Relatabilidad universal. Pain point + aspiración.', 'general', ARRAY['tiktok','instagram'], NULL, 'es', 5),
(2, 'Budget Pain', 'No puedo pagar un {profesional} así que probé con IA', 'Alternativa accesible. Democratización.', 'general', ARRAY['tiktok','instagram','linkedin'], NULL, 'es', 6),
(2, 'Budget Pain', 'Cuando quieres {resultado} pero tu cuenta bancaria dice que no', 'Humor + empatía financiera.', 'general', ARRAY['tiktok','instagram'], NULL, 'es', 7),
(2, 'Budget Pain', 'Transformé {cosa} por $0 usando solo IA', 'Resultado tangible + costo cero. Viral por incredulidad.', 'general', ARRAY['tiktok','instagram','youtube'], NULL, 'es', 8),
-- Tier 3: Direct Problem (ES)
(3, 'Problema Directo', '3 cosas que nadie te dice sobre {tema}', 'Secretos + autoridad. Engagement por FOMO.', 'general', ARRAY['tiktok','instagram','linkedin','youtube'], NULL, 'es', 9),
(3, 'Problema Directo', 'Esto es lo que pasa cuando usas IA para {acción}', 'Demostración directa. Curiosidad por resultado.', 'general', ARRAY['tiktok','instagram'], NULL, 'es', 10),
(3, 'Problema Directo', 'Dejé de hacer {cosa vieja} y empecé a usar IA. Resultado:', 'Antes/después. Transformación personal.', 'general', ARRAY['tiktok','instagram','linkedin'], NULL, 'es', 11),
(3, 'Problema Directo', 'Si tu {negocio/proyecto} no está usando esto, estás perdiendo dinero', 'Urgencia + pérdida. B2B oriented.', 'general', ARRAY['linkedin','tiktok','instagram'], NULL, 'es', 12),
-- Category-specific (ES)
(1, 'Person + Conflict', 'Le mostré a mi mamá lo que la IA piensa que debería verse nuestra cocina', 'Home design viral hook.', 'home', ARRAY['tiktok','instagram'], '161K views', 'es', 13),
(2, 'Budget Pain', 'No puedo pagar un diseñador de interiores así que probé con IA', 'Home design budget hook.', 'home', ARRAY['tiktok','instagram'], NULL, 'es', 14),
(1, 'Person + Conflict', 'Mi dermatóloga no creía que la IA pudiera recomendar una rutina mejor', 'Beauty viral hook.', 'beauty', ARRAY['tiktok','instagram'], NULL, 'es', 15),
(2, 'Budget Pain', 'Rutina de skincare de $200 vs lo que la IA recomienda por $30', 'Beauty budget hook.', 'beauty', ARRAY['tiktok','instagram'], NULL, 'es', 16),
(1, 'Person + Conflict', 'Mi entrenador dijo que la IA no puede crear planes de ejercicio. Le demostré lo contrario', 'Fitness viral hook.', 'fitness', ARRAY['tiktok','instagram','youtube'], NULL, 'es', 17),
(2, 'Budget Pain', 'Cancelé mi gym de $50/mes y la IA me creó un plan mejor gratis', 'Fitness budget hook.', 'fitness', ARRAY['tiktok','instagram'], NULL, 'es', 18),
(1, 'Person + Conflict', 'Mi jefe no creía que pudiera automatizar 4 horas de trabajo con IA', 'Business viral hook.', 'productivity', ARRAY['tiktok','linkedin','instagram'], NULL, 'es', 19),
(3, 'Problema Directo', '5 tareas que tu equipo hace manual y la IA resuelve en segundos', 'Business direct hook.', 'productivity', ARRAY['linkedin','tiktok','instagram'], NULL, 'es', 20),
(1, 'Person + Conflict', 'Le pedí a la IA que me diera el menú de la semana y mi nutricionista quedó impresionada', 'Food viral hook.', 'food', ARRAY['tiktok','instagram'], NULL, 'es', 21),
(2, 'Budget Pain', 'Cómo como saludable toda la semana por menos de $50 gracias a la IA', 'Food budget hook.', 'food', ARRAY['tiktok','instagram','youtube'], NULL, 'es', 22),
-- EN
(1, 'Person + Conflict', 'I showed my {person} what AI thinks our {thing} should look like', 'Personal conflict + AI as mediator.', 'general', ARRAY['tiktok','instagram'], '161K views', 'en', 1),
(1, 'Person + Conflict', 'My {person} said I can''t change anything so I showed her this', 'Restriction + AI solution.', 'general', ARRAY['tiktok','instagram'], '124K views', 'en', 2),
(2, 'Budget Pain', 'POV: You have good taste but no budget', 'Universal relatability.', 'general', ARRAY['tiktok','instagram'], NULL, 'en', 5),
(2, 'Budget Pain', 'I can''t afford a {professional} so I tried AI', 'Accessible alternative.', 'general', ARRAY['tiktok','instagram','linkedin'], NULL, 'en', 6),
(3, 'Direct Problem', '3 things nobody tells you about {topic}', 'Secrets + authority.', 'general', ARRAY['tiktok','instagram','linkedin','youtube'], NULL, 'en', 9),
(3, 'Direct Problem', 'If your {business} isn''t using this, you''re losing money', 'Urgency + loss.', 'general', ARRAY['linkedin','tiktok','instagram'], NULL, 'en', 12),
-- PT
(1, 'Person + Conflict', 'Mostrei para minha {pessoa} o que a IA acha que deveria parecer {coisa}', 'Conflito pessoal + IA como mediador.', 'general', ARRAY['tiktok','instagram'], '161K views', 'pt', 1),
(2, 'Budget Pain', 'POV: Você tem bom gosto mas não tem orçamento', 'Relatabilidade universal.', 'general', ARRAY['tiktok','instagram'], NULL, 'pt', 5),
(3, 'Problema Direto', '3 coisas que ninguém te conta sobre {tema}', 'Segredos + autoridade.', 'general', ARRAY['tiktok','instagram','linkedin','youtube'], NULL, 'pt', 9);
