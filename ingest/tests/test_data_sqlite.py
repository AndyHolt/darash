import sqlite3

import pytest
from data_sqlite import atomic_writer, target_path


def _tables(path) -> set[str]:
    conn = sqlite3.connect(path)
    names = {
        name
        for (name,) in conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
        )
    }
    conn.close()
    return names


class TestTargetPath:
    def test_env_override(self, tmp_path, monkeypatch):
        monkeypatch.setenv("DATA_SQLITE_PATH", str(tmp_path / "custom.sqlite"))
        assert target_path() == tmp_path / "custom.sqlite"

    def test_default_is_ingest_data_sqlite(self, monkeypatch):
        monkeypatch.delenv("DATA_SQLITE_PATH", raising=False)
        assert target_path().name == "data.sqlite"
        assert target_path().parent.name == "ingest"


class TestAtomicWriter:
    def test_writes_target_on_clean_exit(self, tmp_path):
        dest = tmp_path / "data.sqlite"
        with atomic_writer(dest) as conn:
            conn.execute("CREATE TABLE t (x INTEGER)")
            conn.execute("INSERT INTO t VALUES (1)")
            conn.commit()

        assert dest.exists()
        assert _tables(dest) == {"t"}
        # No temp files linger.
        assert list(tmp_path.glob("*.tmp")) == []

    def test_exception_leaves_existing_target_untouched(self, tmp_path):
        dest = tmp_path / "data.sqlite"
        with atomic_writer(dest) as conn:
            conn.execute("CREATE TABLE good (x INTEGER)")
            conn.commit()

        with pytest.raises(RuntimeError):
            with atomic_writer(dest) as conn:
                conn.execute("CREATE TABLE partial (x INTEGER)")
                conn.commit()
                raise RuntimeError("boom")

        # The previous good build survives; the failed one is discarded.
        assert _tables(dest) == {"good"}
        assert list(tmp_path.glob("*.tmp")) == []

    def test_seeds_from_existing_so_sibling_tables_survive(self, tmp_path):
        dest = tmp_path / "data.sqlite"
        # A first (e.g. morphgnt) build.
        with atomic_writer(dest) as conn:
            conn.execute("CREATE TABLE first (x INTEGER)")
            conn.commit()

        # A second (e.g. tahot) build that only creates its own table must not
        # drop the first — the temp is seeded from the existing target.
        with atomic_writer(dest) as conn:
            conn.execute("CREATE TABLE second (x INTEGER)")
            conn.commit()

        assert _tables(dest) == {"first", "second"}
