"""Adversarial unit tests for fixed-cardinality queue metric evidence."""
from pathlib import Path
import tempfile
import unittest

from analyze_economic_queue_wait import read_queue_wait


def fixture(count=61, label='operation', duplicate=False):
    lines = []
    for operation in ('latest', 'availability', 'history'):
        for kind, value in (('count', count), ('sum', 2.5)):
            lines.append(
                f'whv_analytics_economic_timeseries_batch_wait_seconds_{kind}'
                f'{{{label}="{operation}"}} {value}'
            )
    if duplicate:
        lines.append(lines[0])
    return '\n'.join(lines) + '\n'


class BatchWaitContractTests(unittest.TestCase):
    def parse(self, text):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'synthetic.prom'
            path.write_text(text, encoding='utf-8')
            return read_queue_wait(path)

    def test_three_valid_operations_are_bounded(self):
        result = self.parse(fixture())
        self.assertEqual(set(result), {'latest', 'availability', 'history'})
        self.assertEqual(result['history']['count'], 61)
        self.assertEqual(result['history']['mean_wait_ms_all_61_snapshots'], round(2500 / 61, 3))

    def test_rejects_unreviewed_country_label(self):
        with self.assertRaisesRegex(ValueError, 'Unreviewed'):
            self.parse(fixture(label='countryIso3'))

    def test_rejects_missing_operations_or_bad_counter(self):
        with self.assertRaisesRegex(ValueError, 'incorrectly counted'):
            self.parse(fixture(count=60))
        with self.assertRaisesRegex(ValueError, 'incorrectly counted'):
            self.parse('\n'.join(fixture().splitlines()[:4]))

    def test_rejects_duplicate_operation(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            self.parse(fixture(duplicate=True))

    def test_rejects_extra_dynamic_label(self):
        changed = fixture().replace(
            '{operation="latest"}',
            '{operation="latest",country="FRA"}',
        )
        with self.assertRaisesRegex(ValueError, 'Unreviewed'):
            self.parse(changed)


if __name__ == '__main__':
    unittest.main()
