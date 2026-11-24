"""Check the separately installed Neo4j: connection, version, edition, write access, data.

Usage:  python scripts/check_neo4j.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.common import cypher, env  # noqa: E402
from pipeline import graph  # noqa: E402


def main():
    print(f"URI      : {env('NEO4J_URI')}   database: {env('NEO4J_DATABASE', 'neo4j')}")
    try:
        comp = cypher("CALL dbms.components() YIELD name, versions, edition RETURN name, versions, edition")
    except Exception as e:
        print(f"FAIL     : cannot connect ({e.__class__.__name__}: {e})")
        print("hint     : is Neo4j running? are NEO4J_URI / NEO4J_PASSWORD in .env right?")
        return 1
    c = comp[0]
    print(f"server   : {c['name']} {c['versions'][0]} ({c['edition']})")
    cypher("MERGE (t:_DemoWriteTest {id:1}) WITH t DELETE t")
    print("write    : ok")
    n = graph.node_count()
    print(f"nodes    : {n}  ({'demo data' if graph.is_demo_db() else 'empty' if n == 0 else 'NOT demo data - reset will refuse'})")
    print(f"browser  : {env('NEO4J_HTTP_URL')}/browser/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
