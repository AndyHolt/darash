"""Shared destination for the SQLite emit of an ingest run.

The backend reads a single ``data.sqlite`` built by ingest. This module owns the
well-known (gitignored) path that file lands at and an atomic writer that builds
into a temp file in the same directory and ``os.replace``s it into place only on
success — so a failed or partial ingest never replaces a good ``data.sqlite``
(the file-level equivalent of the Postgres TRUNCATE-and-reload discipline).

The temp is seeded from the existing target when present, so a single-corpus run
(``make ingest-morphgnt-run``) rebuilds only its own tables and leaves the other
corpora intact; the combined ``main.py`` run rebuilds all of them regardless.
"""

import os
import shutil
import sqlite3
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

# ingest/data.sqlite (src/../data.sqlite); DATA_SQLITE_PATH overrides it.
DEFAULT_PATH = Path(__file__).resolve().parent.parent / "data.sqlite"


def target_path() -> Path:
    """The path the ingest run writes data.sqlite to."""
    override = os.environ.get("DATA_SQLITE_PATH")
    return Path(override) if override else DEFAULT_PATH


@contextmanager
def atomic_writer(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    """Yield a connection to a temp DB, renamed onto `path` only on clean exit.

    On any exception the temp file is discarded and the existing target is left
    untouched. The temp is seeded from the target if it already exists.
    """
    dest = path if path is not None else target_path()
    dest.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_name = tempfile.mkstemp(
        dir=dest.parent, prefix=dest.name + ".", suffix=".tmp"
    )
    os.close(fd)
    tmp = Path(tmp_name)
    if dest.exists():
        shutil.copyfile(dest, tmp)

    conn = sqlite3.connect(tmp)
    try:
        yield conn
    except BaseException:
        conn.close()
        tmp.unlink(missing_ok=True)
        raise
    conn.close()
    os.replace(tmp, dest)
