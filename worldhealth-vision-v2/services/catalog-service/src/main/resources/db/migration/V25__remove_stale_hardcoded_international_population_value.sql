-- A country editorial release must not carry a permanently embedded
-- "latest World Bank population" value. Such numeric comparisons are
-- produced only from canonical stored observations at request time.
-- Keep prior V24 migrations immutable for existing installations.
update catalog.country_documented_release
set international_comparison_note =
    'International population estimates may have a different reference year, statistical method and revision calendar. Always use the dynamically retrieved latest canonical source values and their dates; a cross-year numerical difference does not establish an error. International reference: https://data.worldbank.org/indicator/SP.POP.TOTL?locations=GA'
where release_code = 'GAB-RGPL-2026-RESIDENTS'
  and verification_status = 'DOCUMENTED_NOT_INGESTED';
