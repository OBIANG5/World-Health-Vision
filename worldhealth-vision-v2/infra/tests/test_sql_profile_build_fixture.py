"""Fail-closed constraints on generating the 54-profile synthetic SQL fixture."""
import unittest

from sql_profile_build_fixture import (
    MARKER, PROFILE_END, PROFILE_START, bind_fixture, economic_codes,
)


def fake_profiles(count=54):
    codes = ["NY.GDP.MKTP.CD"] + [f"TEST.PERF.{n:02d}" for n in range(1, count)]
    return PROFILE_START + "\n" + "\n".join(
        f'EconomicLensProfile(indicator_code="{code}"),' for code in codes
    ) + "\n" + PROFILE_END


class SqlProfileFixtureContracts(unittest.TestCase):
    def test_exact_54_profiles_are_used(self):
        codes = economic_codes(fake_profiles())
        self.assertEqual(len(codes), 54)
        self.assertIn("NY.GDP.MKTP.CD", codes)

    def test_wrong_count_or_duplicates_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "54 unique"):
            economic_codes(fake_profiles(53))
        with self.assertRaisesRegex(ValueError, "54 unique"):
            economic_codes(PROFILE_START + "\n" + 'indicator_code="NY.GDP.MKTP.CD"\n' * 54
                           + PROFILE_END)

    def test_binder_replaces_exactly_two_markers_and_rejects_other_shapes(self):
        codes = economic_codes(fake_profiles())
        result = bind_fixture(f"WHERE code IN ({MARKER}) AND code IN ({MARKER})", codes)
        self.assertEqual(result.count("'NY.GDP.MKTP.CD'"), 2)
        self.assertNotIn(MARKER, result)
        with self.assertRaisesRegex(ValueError, "two"):
            bind_fixture(MARKER, codes)

    def test_sql_injection_like_indicator_code_is_refused(self):
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            bind_fixture(MARKER + MARKER, ("A.B'; DROP",))


if __name__ == "__main__":
    unittest.main()
