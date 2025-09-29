-- Insert ElevenLabs as an AI provider with correct enum types
INSERT INTO public.ai_providers (
  name,
  display_name,
  description,
  base_url,
  auth_type,
  env_key,
  supported_model_types,
  is_active,
  configuration
) VALUES (
  'elevenlabs',
  'ElevenLabs',
  'AI voice synthesis and text-to-speech models',
  'https://api.elevenlabs.io/v1',
  'bearer',
  'ELEVENLABS_API_KEY',
  ARRAY['audio_generation'::ai_model_type],
  true,
  jsonb_build_object(
    'model_types', jsonb_build_object(
      'audio_generation', 'eleven_multilingual_v2'
    ),
    'default_voice_id', '9BWtsMINqrJLrRacOk9x',
    'available_voices', jsonb_build_array(
      jsonb_build_object('id', '9BWtsMINqrJLrRacOk9x', 'name', 'Aria'),
      jsonb_build_object('id', 'CwhRBWXzGAHq8TQ4Fs17', 'name', 'Roger'),
      jsonb_build_object('id', 'EXAVITQu4vr4xnSDxMaL', 'name', 'Sarah'),
      jsonb_build_object('id', 'FGY2WhTYpPnrIDTdsKH5', 'name', 'Laura'),
      jsonb_build_object('id', 'IKne3meq5aSn9XLyUdCD', 'name', 'Charlie')
    )
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  env_key = EXCLUDED.env_key,
  supported_model_types = EXCLUDED.supported_model_types,
  configuration = EXCLUDED.configuration,
  updated_at = now();