-- V23: Register the WDI greenhouse-gas indicator required by the
-- original V2 analytics economic lens (CO2_EMISSIONS).
-- This migration intentionally does not create, invent, or backfill observations.
insert into catalog.indicator (
  code, display_name, topic, unit_label, description,
  preferred_frequency, source_dataset_id, is_core, methodology_notes
) values (
  'EN.GHG.CO2.PC.CE.AR5',
  'Greenhouse gas emissions per capita (t CO2e, AR5)',
  'ENVIRONMENT',
  'TONS_PER_PERSON',
  'Annual greenhouse-gas emissions expressed in tonnes of carbon dioxide equivalent per person using IPCC Fifth Assessment Report global warming potentials.',
  'ANNUAL',
  '10000000-0000-0000-0000-000000000001',
  false,
  'World Bank WDI: EN.GHG.CO2.PC.CE.AR5. This is a greenhouse-gas CO2-equivalent indicator, not a pure fossil-fuel CO2 measure. Confirm coverage and methodological changes before interpreting trends.'
)
on conflict (code) do update set
  display_name = excluded.display_name,
  topic = excluded.topic,
  unit_label = excluded.unit_label,
  description = excluded.description,
  preferred_frequency = excluded.preferred_frequency,
  source_dataset_id = excluded.source_dataset_id,
  is_core = excluded.is_core,
  methodology_notes = excluded.methodology_notes;
